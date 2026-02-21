import { Module } from "@nestjs/common";
import { WebhookController } from "./controller/WebhookController";
import { ProcessWebhookService } from "./service/ProcessWebhookService";
import { WebhookRepository } from "./repository/WebhookRepository";
import { PaymentModule } from "../payment/PaymentModule";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { RABBITMQ_SERVICE } from "../../config/rabbitmq/rabbitmq";
import { env } from "process";
import { PaymentSucceededService } from "./service/PaymentSucceededService";
import { PaymentCanceledService } from "./service/PaymentCanceledService";
import { PaymentRefundedService } from "./service/PaymentRefundedService";
import { PaymentAuthorizedService } from "./service/PaymentAuthorizedService";

@Module({
    controllers: [WebhookController],
    providers: [
        ProcessWebhookService,
        WebhookRepository,
        PaymentSucceededService,
        PaymentCanceledService,
        PaymentRefundedService,
        PaymentAuthorizedService
    ],
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