export class PaymentNotBelongUser extends Error {
    constructor() {
        super("Payment does not belong to the user!");
    }
}