import { Prisma } from "@prisma/client";

export interface IPaymentRepository {
    create(payment: Prisma.PaymentCreateInput)
}