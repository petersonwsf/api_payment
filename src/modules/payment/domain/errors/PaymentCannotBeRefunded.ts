export class PaymentCannotBeRefunded extends Error {
    constructor() {
        super("The payment cannot be refunded!")
    }
}