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
}