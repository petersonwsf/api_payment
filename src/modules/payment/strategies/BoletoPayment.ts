import Stripe from 'stripe';
import { IPayementStrategy } from './interfaces/IPaymentStrategy';
import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';

@Injectable()
export class BoletoPayment implements IPayementStrategy {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe) {}

  async createPayment(
    data: any,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency ?? 'brl',
      payment_method_types: ['boleto'],
      capture_method: 'automatic',
      payment_method_options: {
        boleto: {
          expires_after_days: 5,
        },
      },
      metadata: {
        reservationId: String(data.reservationId),
      },
    });

    return paymentIntent;
  }
}
