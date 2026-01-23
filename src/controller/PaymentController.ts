import { BadRequestException, Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { CreatePaymentIntent } from 'src/dtos/CreatePaymentIntent';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/config/stripe/stripe';
import * as zod from 'zod'
import { PaymentCreateService } from 'src/service/PaymentCreateService';

@Controller('payment')
export class PaymentController {
    constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
                private readonly createService: PaymentCreateService) {}

    @Post()
    @HttpCode(201)
    async createPaymentIntent(@Body() data: CreatePaymentIntent) {
        try {
            await this.createService.execute(data)
        } catch (error) {
            if (error instanceof zod.ZodError) {
                throw new BadRequestException({message: "Problema de validação"})
            }
        }
    }
}