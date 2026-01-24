import { Prisma } from "@prisma/client";

export interface IWebhookRepository {
    create(data: Prisma.StripeWebhookEventCreateInput)
}