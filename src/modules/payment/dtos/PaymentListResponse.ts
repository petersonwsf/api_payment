import { PaymentStatus } from "@prisma/client";

export interface PaymentListResponse {
    id: number;
    reservationId: number;
    amountAuthorized: number;
    amountCaptured: number;
    status: PaymentStatus;
    currency: string;
    createdAt: Date;
    updatedAt: Date
}