import { Inject, Injectable } from "@nestjs/common";
import { PaymentRepository } from "../repository/PaymentRepository";
import { isNumber } from "src/utils/isNumber";
import { InvalidId } from "../domain/errors/InvalidId";
import { PaymentNotFound } from "../domain/errors/PaymentNotFound";
import { STRIPE_CLIENT } from "src/config/stripe/stripe";
import Stripe from "stripe";
import { paymentStatusForRefund } from "../domain/enums/PaymentStatusForRefund";
import { PaymentCannotBeRefunded } from "../domain/errors/PaymentCannotBeRefunded";
import { UserDTO } from "../dtos/UserDTO";
import { PaymentNotBelongUser } from "../domain/errors/PaymentNotBelongUser";

interface RefundData {
    id: number | string;
    user: UserDTO;
}

@Injectable()
export class RefundPaymentService {
    constructor(private readonly repository : PaymentRepository,
                @Inject(STRIPE_CLIENT) private readonly stripe : Stripe 
    ) {}

    async execute(data : RefundData) : Promise<{id: number, message: string}> {
        
        const { id, user } = data

        if (!isNumber(id)) throw new InvalidId()
        
        const payment = await this.repository.findPaymentById(Number(id))

        if (!payment) throw new PaymentNotFound()
            
        if (user.role !== 'ADMIN') {
            if (payment.userId !== user.id) {
                throw new PaymentNotBelongUser()
            }
        }
        
        const stripePayment = await this.stripe.paymentIntents.retrieve(payment.stripePaymentIntentId)

        if (!paymentStatusForRefund.includes(stripePayment.status)) throw new PaymentCannotBeRefunded()
        
        await this.stripe.paymentIntents.cancel(payment.stripePaymentIntentId)

        await this.repository.update(Number(id), {status : 'REFUNDED' })

        return {
            id: payment.id,
            message: "Refund the payment succesfully processed!"
        }
    }
}