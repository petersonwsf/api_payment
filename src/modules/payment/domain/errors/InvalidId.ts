export class InvalidId extends Error {
    constructor() {
        super("The ID is invalid!")
    }
}