export class AmountZero extends Error {
    constructor() {
        super("The value cannot be zero.");
    }
}