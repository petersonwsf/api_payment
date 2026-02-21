import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { StripeWebhookEvent } from "@prisma/client";
import { RABBITMQ_SERVICE } from "src/config/rabbitmq/rabbitmq";

@Injectable()
export class PaymentCanceledService {
    
    constructor(@Inject(RABBITMQ_SERVICE) private readonly rabbitmq: ClientProxy) {}
    
    async execute(data: StripeWebhookEvent) {
        const { reservationId , payload } = data
        this.rabbitmq.emit('reservation_canceled', { reservationId, payload })
    }
}