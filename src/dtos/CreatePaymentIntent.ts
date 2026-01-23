export interface CreatePaymentIntent {
    reservationId: number;
    amount: number;
    method: string;
    currency?: string;
    customerEmail?: string;
}