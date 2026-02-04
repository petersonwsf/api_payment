export class ValueAbovePermitted extends Error {
    constructor() {
        super("The value is above the permitted limit!")
    }
}