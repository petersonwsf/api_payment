import { CaptureMethod, PaymentStatus } from "@prisma/client";

export interface PaymentDetails {
    id: number;
    stripePaymentIntentId: string;
    clientSecret: string | null;
    reservationId: number;
    amount: number;
    currency: string
    status: string;
    captureMethod: CaptureMethod;
}

/* 

"paymentId": 123,
  "paymentIntentId": "pi_...",
  "clientSecret": "pi_..._secret_...",
  "status": "requires_payment_method",
  "amount": 5050,
  "currency": "brl",
  "reservationId": 987,
  "captureMethod": "MANUAL"*/