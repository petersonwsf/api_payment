import { Inject, Injectable } from "@nestjs/common";
import { PaymentRepository } from "../repository/PaymentRepository";
import { isNumber } from "src/utils/isNumber";
import { InvalidId } from "../domain/errors/InvalidId";
import { PaymentDetails } from "../dtos/PaymentDetails";
import { PaymentNotFound } from "../domain/errors/PaymentNotFound";
import { STRIPE_CLIENT } from "src/config/stripe/stripe";
import Stripe from "stripe";

@Injectable()
export class FindPaymentByIdService {
    constructor(private readonly repository : PaymentRepository,
                @Inject(STRIPE_CLIENT) private readonly stripe : Stripe) {}

    async execute(id: string) : Promise<PaymentDetails> {

        if (!isNumber(id)) throw new InvalidId()
        
        const payment = await this.repository.findPaymentById(Number(id))

        if (!payment) throw new PaymentNotFound()
        
        const stripePaymentIntent = await this.stripe.paymentIntents.retrieve(payment.stripePaymentIntentId)

        const paymentDetails : PaymentDetails = {
            id: payment.id,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            clientSecret: stripePaymentIntent.client_secret,
            reservationId: payment.reservationId,
            amount: payment.amountAuthorized,
            currency: payment.currency,
            status: stripePaymentIntent.status,
            captureMethod: payment.captureMethod
        }

        return paymentDetails
    }
}