import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { STRIPE_CLIENT } from "src/config/stripe/stripe";
import Stripe from "stripe";
import { PaymentRepository } from "../repository/PaymentRepository";
import { PaymentNotFound } from "../domain/errors/PaymentNotFound";
import { PaymentCaptureDTO } from "../dtos/PaymentCaptureDTO";
import * as zod from 'zod'
import { Method } from "../domain/enums/Method";
import { PaymentMethodService } from "../dtos/PaymentMethodService";
import { CardPayment } from "./CardPayment";
import { BoletoPayment } from "./BoletoPayment";
import { CaptureMethod, PaymentStatus, Prisma } from "@prisma/client";
import { PaymentAutomaticCapture } from "../domain/errors/PaymentAutomaticCapture";
import { PaymentCannotBeCaptured } from "../domain/errors/PaymentCannotBeCaptured";
import { PaymentNotAuthorized } from "../domain/errors/PaymentNotAuthorized";
import { AmountZero } from "../domain/errors/AmountZero.error";
import { ValueAbovePermitted } from "../domain/errors/ValueAbovePermitted";
import { StripeError } from "../domain/errors/StripeError";

@Injectable()
export class AmountCaptureService {
    constructor(@Inject(STRIPE_CLIENT) private readonly stripe : Stripe,
                private readonly repository : PaymentRepository) {}

    async execute(data: PaymentCaptureDTO) {

        const validationSchema = zod.object({
            id: zod.coerce.number().int(),
            amount: zod.coerce.number(),
            method: zod.nativeEnum(Method).optional()
        })

        const dataValid = validationSchema.parse(data)

        const valueInCents = Math.round(dataValid.amount * 100);
        
        const payment = await this.repository.findPaymentById(dataValid.id)

        if (!payment) throw new PaymentNotFound()
        
        if (payment.captureMethod != CaptureMethod.MANUAL) throw new PaymentAutomaticCapture()

        if (([] as PaymentStatus[]).concat([PaymentStatus.CAPTURED, PaymentStatus.REFUNDED, PaymentStatus.FAILED, PaymentStatus.CANCELED]).includes(payment.status)) throw new PaymentCannotBeCaptured()
        
        if (payment.status != PaymentStatus.AUTHORIZED) throw new PaymentNotAuthorized()
        
        if (valueInCents <= 0) throw new AmountZero()
        
        if (valueInCents > payment.amountAuthorized) throw new ValueAbovePermitted()

        let captured: Stripe.PaymentIntent;

        try {
            captured = await this.stripe.paymentIntents.capture(payment.stripePaymentIntentId, { 
                amount_to_capture: valueInCents 
            })
        } catch (error) {
            throw error;
        }

        if (captured.status != 'succeeded') throw new StripeError("Payment not succeeded, wait a minute!")

        const amountReceived = captured.amount_received ?? valueInCents

        await this.repository.update(payment.id, { status: PaymentStatus.CAPTURED, amountCaptured: amountReceived } )

        const remainder = payment.amountAuthorized - amountReceived

        if (remainder > 0) {
            
            if (!dataValid.method) throw new BadRequestException("É obrigatório método de pagamento em caso de pagamento incompleto!")

            let paymentMethod : PaymentMethodService;
            if (dataValid.method == 'card') paymentMethod = new CardPayment(this.stripe)
            else paymentMethod = new BoletoPayment(this.stripe)

            const captureMethod = paymentMethod instanceof CardPayment ? CaptureMethod.MANUAL : CaptureMethod.AUTOMATIC

            const stripeNewPayment : Stripe.Response<Stripe.PaymentIntent> = await paymentMethod.createPayment({
                amount: remainder,
                currency: payment.currency,
                reservationId: payment.reservationId
            })

            const newPayment : Prisma.PaymentCreateInput = {
                amountAuthorized : remainder,
                currency: payment.currency,
                reservationId: payment.reservationId,
                captureMethod: captureMethod,
                status: PaymentStatus.CREATED,
                stripePaymentIntentId: stripeNewPayment.id
            }

            const paymentRecord = await this.repository.create(newPayment)

            return paymentRecord
        }

        const newPayment = {
            ...payment,
            amountCaptured: amountReceived,
            status: PaymentStatus.CAPTURED
        }

        return newPayment
        
    }
}