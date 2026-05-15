import { CaptureMethod } from '@prisma/client';

export interface PaymentDetails {
  id: number;
  stripePaymentIntentId: string;
  clientSecret: string | null;
  reservationId: number;
  amount: number;
  currency: string;
  status: string;
  captureMethod: CaptureMethod;
}