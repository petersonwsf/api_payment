import { Currency } from "../domain/enums/Currency";
import { PaymentMethod } from "../domain/enums/PaymentMethod";

export interface CreatePaymentIntent {
    reservationId: number;
    amount: number;
    method: PaymentMethod;
    currency?: Currency;
    customerEmail?: string;
}