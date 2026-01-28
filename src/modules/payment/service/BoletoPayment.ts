import Stripe from "stripe";
import { CreatePaymentIntent } from "../dtos/CreatePaymentIntent";
import { PaymentMethodService } from "../dtos/PaymentMethodService";
import { Injectable } from "@nestjs/common";

export class BoletoPayment implements PaymentMethodService {

    stripe : Stripe

    constructor(stripe: Stripe) {
        this.stripe = stripe    
    }

    async createPayment(data: any) : Promise<Stripe.Response<Stripe.PaymentIntent>> {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: data.amount,
            currency: data.currency ?? 'brl',
            payment_method_types: ['boleto'],
            capture_method: 'automatic',
            payment_method_options: {
                boleto: {
                    expires_after_days: 5
                }
            },
            metadata: {
                reservationId: String(data.reservationId)
            }
        })

        return paymentIntent;
    }  
}