import { Module } from "@nestjs/common";
import { WebhookController } from "./controller/WebhookController";
import { ProcessWebhookService } from "./service/ProcessWebhookService";
import { WebhookRepository } from "./repository/WebhookRepository";
import { PaymentModule } from "../payment/PaymentModule";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { RABBITMQ_SERVICE } from "../../config/rabbitmq/rabbitmq";
import { env } from "process";

@Module({
    controllers: [WebhookController],
    providers: [ProcessWebhookService, WebhookRepository],
    imports: [
        PaymentModule,
        ClientsModule.register([
            {
                name: RABBITMQ_SERVICE,
                transport: Transport.RMQ,
                options: {
                    urls: [env.RABBITMQ_URL ?? ''],
                    queue: 'payment_queue',
                    queueOptions: {
                        durable: true
                    }
                }
            }
        ])
    ]
})
export class WebhookModule {}