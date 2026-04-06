import Stripe from 'stripe';
import { IPayementStrategy } from './interfaces/IPaymentStrategy';
import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';

@Injectable()
export class CardPayment implements IPayementStrategy {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe) {}

  async createPayment(
    data: any,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency ?? 'brl',
      capture_method: 'manual',
      payment_method_types: ['card'],
      metadata: {
        reservationId: String(data.reservationId),
      },
    });

    return paymentIntent;
  }
}
