import { IPaymentRepository } from "./IPaymentRepository";
import { prisma } from '../../../lib/prisma';
import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PaymentRepository implements IPaymentRepository {
    async create(data: Prisma.PaymentCreateInput) {
        const payment = await prisma.payment.create({ data });
        return payment;
    }

    async findReservationPayments( reservationId : number ) {
        const payments = await prisma.payment.findMany({
            where: {
                reservationId,
                status: {
                    in: ['CREATED', 'AUTHORIZED', 'REQUIRES_ACTION']
                }
            }
        })
        return payments
    }

    async findPaymentById( id : number ) {
        const payment = await prisma.payment.findFirst({
            where: { 
                id
            }
        })
        return payment
    }

    async refundPayment( id : number ) {
        await prisma.payment.update({
            where: { id },
            data: { status: 'REFUNDED' }
        })
    }
}