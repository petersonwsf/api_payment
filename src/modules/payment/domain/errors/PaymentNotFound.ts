export class PaymentNotFound extends Error {
    constructor() {
        super("Payment with this ID not found!")
    }
}