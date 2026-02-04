import { PaymentStatus } from "@prisma/client";

export interface UpdatePaymentDTO {
    status?: PaymentStatus;
    amountCaptured?: number;
}