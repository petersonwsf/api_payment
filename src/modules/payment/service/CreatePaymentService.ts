import { Inject, Injectable } from "@nestjs/common";
import * as z from 'zod'
import { AmountZero } from "../domain/errors/AmountZero.error";
import { PaymentMethod } from "../domain/enums/PaymentMethod";
import { Currency } from "../domain/enums/Currency";
import Stripe from "stripe";
import { STRIPE_CLIENT } from "src/config/stripe/stripe";
import { Prisma } from "@prisma/client";
import { PaymentStatus, CaptureMethod } from "@prisma/client";
import { PaymentRepository } from "../repository/PaymentRepository";

interface IRequest {
    reservationId: number;
    amount: number;
    method: PaymentMethod;
    currency?: Currency;
    customerEmail?: string;
}

@Injectable()
export class CreatePaymentService {
    constructor (@Inject(STRIPE_CLIENT) private readonly stripe: Stripe, 
                private readonly repository : PaymentRepository) {}
    
    async execute(data: IRequest) {
        const schemaValidation = z.object({
            reservationId: z.number(),
            amount: z.number(),
            method: z.string(),
            currency: z.string().optional(),
            customerEmail: z.string().optional()
        })

        const dataValid = schemaValidation.parse(data)

        if (dataValid.amount <= 0) throw new AmountZero();

        const valueInCents = Math.round(dataValid.amount * 100);

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: valueInCents,
            currency: dataValid.currency ?? 'brl',
            capture_method: 'manual',
            automatic_payment_methods: {
                enabled: true
            },
            metadata: {
                reservationId: String(dataValid.reservationId)
            }
        })

        const paymentData : Prisma.PaymentCreateInput = {
            reservationId: dataValid.reservationId,
            stripePaymentIntentId: paymentIntent.id,
            amountAuthorized: valueInCents,
            amountCaptured: 0,
            status: PaymentStatus.CREATED,
            captureMethod: CaptureMethod.MANUAL,
        }

        const payment = await this.repository.create(paymentData);

        return payment;
    }
}