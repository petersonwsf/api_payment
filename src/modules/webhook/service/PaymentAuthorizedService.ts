import { Injectable } from "@nestjs/common";
import { StripeWebhookEvent } from "@prisma/client";

@Injectable()
export class PaymentAuthorizedService {
    async execute(data : StripeWebhookEvent) {
        const { reservationId, payload } = data
    }
}