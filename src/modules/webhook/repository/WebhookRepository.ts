import { Prisma, StripeWebhookEvent, WebhookProcessStatus } from "@prisma/client";
import { IWebhookRepository } from "./IWebhookRepository";
import { prisma } from "src/lib/prisma";
import { Injectable } from "@nestjs/common";

@Injectable()
export class WebhookRepository implements IWebhookRepository {
    async create(data: Prisma.StripeWebhookEventCreateInput) {
        return await prisma.stripeWebhookEvent.upsert({
            where: { stripeEventId: data.stripeEventId },
            create: data,
            update: {}
        })
    }

    async findByStripeEventId(id: string) {
        const eventExisting = await prisma.stripeWebhookEvent.findUnique({
            where: { stripeEventId: id }
        })
        return eventExisting;
    }

    async processWebhook(id: number, status: WebhookProcessStatus, errorMessage?: string) {
        await prisma.stripeWebhookEvent.update({
            where: { id },
            data: { status: status, processedAt: new Date(), errorMessage: errorMessage}
        })
    }
}