import { BadRequestException, Controller, Headers, Inject, Post, Req } from "@nestjs/common";
import { Request } from "express";
import type { RawBodyRequest } from "@nestjs/common";
import { STRIPE_CLIENT } from "src/config/stripe/stripe";
import Stripe from "stripe";
import { env } from "process";
import { ProcessWebhookService } from "../service/ProcessWebhookService";

@Controller('webhook')
export class WebhookController {

    constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe, private readonly service : ProcessWebhookService) {}
    
    @Post('/confirm')
    async processWebhook(@Req() req : RawBodyRequest<Request>, @Headers('stripe-signature') sig : string) {
        
        if (!req.rawBody) throw new BadRequestException('Request body not found!')
        let event : Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(req.rawBody, sig, env.STRIPE_WEBHOOK_SECRET!)
        } catch (error) {
            throw new BadRequestException(`Signature validation failed ${error.message}`)
        }

        await this.service.execute(event);

        return { received: true }
    }
}

/*
{
  "id": "evt_123...", 
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3O...",          // O ID da intenção de pagamento
      "amount": 10000,           // Valor em centavos
      "currency": "brl",
      "status": "succeeded",
      "metadata": {
        "reservationId": "45"    // O SEU DADO ESTÁ AQUI!
      },
      "payment_method": "pm_...", // ID do método usado
      "charges": {               // Detalhes da cobrança gerada
        "data": [
          {
            "id": "ch_...",
            "receipt_url": "https://..." // Link do recibo
          }
        ]
      }
    }
  }
}


model StripeWebhookEvent {
  id              Int    @id @default(autoincrement())
  stripeEventId   String @unique
  type            String
  apiVersion      String?
  livemode        Boolean @default(false)
  requestId       String?
  idempotencyId   String?
  paymentIntentId String?
  reservationId   Int?
  payload         Json
  receivedAt      DateTime @default(now())
  processedAt     DateTime? 
  status          WebhookProcessStatus @default(RECEIVED)
  errorMessage    String?

  @@index([type])
  @@index([paymentIntentId])
  @@index([reservationId])
  @@index([status, receivedAt])
}
*/