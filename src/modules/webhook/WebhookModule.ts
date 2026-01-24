import { Module } from "@nestjs/common";
import { WebhookController } from "./controller/WebhookController";
import { ProcessWebhookService } from "./service/ProcessWebhookService";
import { WebhookRepository } from "./repository/WebhookRepository";
import { PaymentModule } from "../payment/PaymentModule";

@Module({
    controllers: [WebhookController],
    providers: [ProcessWebhookService, WebhookRepository],
    imports: [PaymentModule]
})
export class WebhookModule {}