import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhookRepository } from '../repository/WebhookRepository';
import { WebhookProcessStatus } from '@prisma/client';
import { ProcessWebhookService } from './ProcessWebhookService';
import Stripe from 'stripe';

@Injectable()
export class ProccessWebhookSchedule {
  constructor(
    private readonly repository: WebhookRepository,
    private readonly processWebhookService: ProcessWebhookService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async proccessWebhook() {
    const webhookEvents = await this.repository.findByStatus(
      WebhookProcessStatus.RECEIVED,
    );

    console.log('Aqui funcionando');

    if (webhookEvents.length === 0) return;

    for (const event of webhookEvents) {
      try {
        const stripeEvent = event.payload as unknown as Stripe.Event;
        await this.processWebhookService.execute(stripeEvent);
      } catch (err) {
        console.log(`Erro ao processar webhook: ${err.message}`);
      }
    }
  }
}
