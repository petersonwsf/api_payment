import { Injectable } from "@nestjs/common";
import { ReservationPaymentNotFound } from "../domain/errors/ReservationPaymentNotFound";
import { PaymentRepository } from "../repository/PaymentRepository";
import { InvalidId } from "../domain/errors/InvalidId";
import { PaymentListResponse } from "../dtos/PaymentListResponse";
import { Payment } from "@prisma/client";
import { isNumber } from "src/utils/isNumber";

@Injectable()
export class FindPaymentByReservationService {
    constructor( private readonly repository : PaymentRepository ) {}

    async execute(reservationId : string) : Promise<PaymentListResponse[]> {

        if (!isNumber(reservationId)) throw new InvalidId()
        
        const payments : Payment[] = await this.repository.findReservationPayments(Number(reservationId))

        const listPayments : PaymentListResponse[] = payments.map(payment => {
            return {
                id: payment.id,
                reservationId: payment.reservationId,
                status: payment.status,
                amountAuthorized: payment.amountAuthorized,
                amountCaptured: payment.amountCaptured,
                currency: payment.currency,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt
            }
        })

        if (listPayments.length == 0) throw new ReservationPaymentNotFound()
        
        return listPayments
    }
}