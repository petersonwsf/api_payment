import Stripe from 'stripe';

export interface PaymentResult {
  paymentIntent: Stripe.PaymentIntent;
  boletoUrl: string | undefined;
  codeBar: string | undefined;
}

export interface IPayementStrategy {
  createPayment(data: any): Promise<PaymentResult>;
}
