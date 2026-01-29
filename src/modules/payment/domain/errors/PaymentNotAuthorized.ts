export class PaymentNotAuthorized extends Error {
    constructor() {
        super("The payment was not authorized!")
    }
}