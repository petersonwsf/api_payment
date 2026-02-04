export class PaymentCannotBeCaptured extends Error {
    constructor(){
        super("The payment cannot be captured!")
    }
}