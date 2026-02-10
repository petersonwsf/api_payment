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

