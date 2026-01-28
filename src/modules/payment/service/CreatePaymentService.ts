import { Inject, Injectable } from "@nestjs/common";
import * as z from 'zod'
import { AmountZero } from "../domain/errors/AmountZero.error";
import { Currency } from "../domain/enums/Currency";
import Stripe from "stripe";
import { STRIPE_CLIENT } from "src/config/stripe/stripe";
import { Prisma } from "@prisma/client";
import { PaymentStatus, CaptureMethod } from "@prisma/client";
import { PaymentRepository } from "../repository/PaymentRepository";
import { Method } from "../domain/enums/Method";
import { PaymentMethodService } from "../dtos/PaymentMethodService";
import { CardPayment } from "./CardPayment";
import { BoletoPayment } from "./BoletoPayment";

interface IRequest {
    reservationId: number;
    amount: number;
    method?: Method;
    currency?: Currency;
    customerEmail?: string;
}

@Injectable()
export class CreatePaymentService {
    constructor (@Inject(STRIPE_CLIENT) private readonly stripe: Stripe, 
                private readonly repository : PaymentRepository) {}
    
    async execute(data: IRequest) {
        
        let paymentMethod : PaymentMethodService = new CardPayment(this.stripe)

        const schemaValidation = z.object({
            reservationId: z.number(),
            amount: z.number(),
            method: z.enum(Method),
            currency: z.string().optional(),
            customerEmail: z.string().optional()
        })

        const dataValid = schemaValidation.parse(data)

        if (dataValid.amount <= 0) throw new AmountZero();

        const valueInCents = Math.round(dataValid.amount * 100);

        dataValid.amount = valueInCents

        if (dataValid.method == 'boleto') paymentMethod = new BoletoPayment(this.stripe)

        const paymentIntent : Stripe.Response<Stripe.PaymentIntent> = await paymentMethod.createPayment(dataValid);

        const paymentData : Prisma.PaymentCreateInput = {
            reservationId: dataValid.reservationId,
            stripePaymentIntentId: paymentIntent.id,
            amountAuthorized: valueInCents,
            amountCaptured: 0,
            status: PaymentStatus.CREATED,
            captureMethod: CaptureMethod.MANUAL,
        }

        const payment = await this.repository.create(paymentData);

        return {
            clientSecret: paymentIntent.client_secret,
            ...payment
        };
    }
}