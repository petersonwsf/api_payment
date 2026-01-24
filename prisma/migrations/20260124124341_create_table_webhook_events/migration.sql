-- CreateEnum
CREATE TYPE "WebhookProcessStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" SERIAL NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "apiVersion" TEXT,
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "requestId" TEXT,
    "idempotencyId" TEXT,
    "paymentIntentId" TEXT,
    "reservationId" INTEGER,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "WebhookProcessStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_type_idx" ON "StripeWebhookEvent"("type");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_paymentIntentId_idx" ON "StripeWebhookEvent"("paymentIntentId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_reservationId_idx" ON "StripeWebhookEvent"("reservationId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_status_receivedAt_idx" ON "StripeWebhookEvent"("status", "receivedAt");
