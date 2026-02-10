import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { WebhookRepository } from "../repository/WebhookRepository";

@Injectable()
export class ProcessWebhookService {

    constructor(private readonly repository: WebhookRepository) {}

    async execute(data: any) {
        
        const dataEvent = data as Stripe.Event
    
        const dataObject = dataEvent.data.object as any

        const existingEvent = await this.repository.findByStripeEventId(dataEvent.id)

        if (existingEvent && existingEvent.status == 'PROCESSED') return;

        const reservationId = dataObject.metadata?.reservationId ? parseInt(dataObject.metadata.reservationId) : null

        const webhookData: Prisma.StripeWebhookEventCreateInput = {
            stripeEventId: dataEvent.id,
            type: dataEvent.type,
            apiVersion: dataEvent.api_version,
            livemode: dataEvent.livemode,
            requestId: dataEvent.request?.id,
            idempotencyId: dataEvent.request?.idempotency_key,

            paymentIntentId: dataObject.payment_intent || (dataObject.id.startsWith('pi_') ? dataObject.id : null),
            reservationId: reservationId,
            payload: dataEvent as any,
            status: 'RECEIVED'
        }

        const webhook = await this.repository.create( webhookData )
        
        try {
            switch (dataEvent.type) {
                case 'payment_intent.amount_capturable_updated':
            }
        } catch (error) {
            await this.repository.processWebhook(webhook.id, 'FAILED', error.message)
            throw error
        }
    }
}