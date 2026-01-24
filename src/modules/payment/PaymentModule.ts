import { Module } from '@nestjs/common';
import { PaymentController } from './controller/PaymentController';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/config/stripe/stripe';
import { PaymentCreateService } from './service/PaymentCreateService';
import { env } from 'process';

@Module({
    providers: [
        PaymentCreateService,
        {provide: STRIPE_CLIENT,
        useFactory: () => new Stripe(env.STRIPE_SECRET_KEY ?? '', {
            apiVersion: '2025-12-15.clover',
        }),
    }],
    exports: [STRIPE_CLIENT],
    controllers: [PaymentController]
})
export class PaymentModule {}