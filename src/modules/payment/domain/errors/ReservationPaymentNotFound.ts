export class ReservationPaymentNotFound extends Error {
    constructor() {
        super("Reservation payment not found!");
    }
}