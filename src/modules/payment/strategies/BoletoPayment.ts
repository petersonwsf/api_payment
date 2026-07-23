import Stripe from 'stripe';
import {
  IPayementStrategy,
  PaymentResult,
} from './interfaces/IPaymentStrategy';
import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';

@Injectable()
export class BoletoPayment implements IPayementStrategy {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe) {}

  async createPayment(data: any): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency ?? 'brl',
      payment_method_types: ['boleto'],
      confirm: true,
      payment_method_data: {
        type: 'boleto',
        boleto: {
          tax_id: '12236893442',
        },
        billing_details: {
          name: data.customerName ?? 'Cliente Importado',
          email: data.customerEmail,
          address: {
            line1: 'Rua da Aurora, 1000',
            city: 'Rio tinto',
            state: 'PE',
            postal_code: '58297000',
            country: 'BR',
          }
        },
      },
      payment_method_options: {
        boleto: {
          expires_after_days: 5,
        },
      },
      metadata: {
        reservationId: String(data.reservationId),
      },
    });

    // 2. Como passamos 'confirm: true', o next_action já vem preenchido direto aqui!
    const boletoDetails = paymentIntent.next_action?.boleto_display_details;

    return {
      paymentIntent: paymentIntent,
      boletoUrl: boletoDetails!.hosted_voucher_url!,
      codeBar: boletoDetails!.number!,
    };
  }
}
