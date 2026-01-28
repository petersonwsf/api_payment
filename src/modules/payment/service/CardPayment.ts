import Stripe from "stripe";
import { CreatePaymentIntent } from "../dtos/CreatePaymentIntent";
import { PaymentMethodService } from "../dtos/PaymentMethodService";

export class CardPayment implements PaymentMethodService {

    stripe : Stripe

    constructor(stripe: Stripe) {
        this.stripe = stripe    
    }

    async createPayment(data: any) :  Promise<Stripe.Response<Stripe.PaymentIntent>> {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: data.amount,
            currency: data.currency ?? 'brl',
            capture_method: 'manual',
            payment_method_types: ['card'],
            metadata: {
                reservationId: String(data.reservationId)
            }
        })

        return paymentIntent;
    }  
}