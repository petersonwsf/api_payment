import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { StripeWebhookEvent } from "@prisma/client";
import { RABBITMQ_SERVICE } from "src/config/rabbitmq/rabbitmq";

@Injectable()
export class PaymentAuthorizedService {

    constructor(@Inject(RABBITMQ_SERVICE) private readonly rabbitmqService: ClientProxy) {}

    async execute(data : StripeWebhookEvent) {
        const { reservationId, payload } = data
        this.rabbitmqService.emit('reservation_confirmed', {reservationId, payload})
    }
}