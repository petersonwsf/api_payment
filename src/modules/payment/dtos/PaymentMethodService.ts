import { CreatePaymentIntent } from "src/modules/payment/dtos/CreatePaymentIntent";

export interface PaymentMethodService {
    createPayment(data: any)
}