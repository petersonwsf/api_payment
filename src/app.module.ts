import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './modules/payment/PaymentModule';
import { WebhookModule } from './modules/webhook/WebhookModule';

@Module({
  imports: [PaymentModule, WebhookModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
