import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { StripeWebhookEvent } from '@prisma/client';
import { RABBITMQ_SERVICE } from 'src/common/rabbitmq/rabbitmq.constants';

@Injectable()
export class PaymentAuthorizedService {
  constructor(
    @Inject(RABBITMQ_SERVICE) private readonly rabbitmq: ClientProxy,
  ) {}

  execute(data: StripeWebhookEvent) {
    const { reservationId, payload } = data;
    this.rabbitmq.emit('reservation_confirmed', { reservationId, payload });
  }
}
