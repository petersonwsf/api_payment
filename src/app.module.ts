import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './modules/payment/PaymentModule';
import { WebhookModule } from './modules/webhook/WebhookModule';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PaymentModule, WebhookModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
