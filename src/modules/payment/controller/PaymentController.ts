import { BadRequestException, Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { CreatePaymentIntent } from 'src/modules/payment/dtos/CreatePaymentIntent';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/config/stripe/stripe';
import * as zod from 'zod'
import { PaymentCreateService } from '../service/PaymentCreateService';
import { AmountZero } from '../domain/errors/AmountZero.error';

@Controller('payment')
export class PaymentController {
    constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
                private readonly createService: PaymentCreateService) {}

    @Post()
    @HttpCode(201)
    async createPaymentIntent(@Body() data: CreatePaymentIntent) {
        try {
            const payment = await this.createService.execute(data)
            return {payment}
        } catch (error) {
            if (error instanceof zod.ZodError) {
                throw new BadRequestException({message: "Dados inválidos"})
            } else if (error instanceof AmountZero) {
                throw new BadRequestException({message: error.message})
            }
        }
    }
}