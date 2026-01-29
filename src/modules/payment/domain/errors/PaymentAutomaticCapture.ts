export class PaymentAutomaticCapture extends Error {
    constructor() {
        super("Automatic payment cannot be paid!")
    }
}