import { Module } from '@nestjs/common';
import { PaymentController } from 'src/controller/PaymentController';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/config/stripe/stripe';
import { PaymentCreateService } from 'src/service/PaymentCreateService';

@Module({
    providers: [
        PaymentCreateService,
        {provide: STRIPE_CLIENT,
        useFactory: () => new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
            apiVersion: '2025-12-15.clover',
        }),
    }],
    exports: [STRIPE_CLIENT],
    controllers: [PaymentController]
})
export class PaymentModule {}