import { Module } from '@nestjs/common';
import { PaymentController } from './controller/PaymentController';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/config/stripe/stripe';
import { CreatePaymentService } from './service/CreatePaymentService';
import { env } from 'process';
import { PaymentRepository } from './repository/PaymentRepository';
import { FindPaymentByReservationService } from './service/FindPaymentByReservationService';
import { FindPaymentByIdService } from './service/FindPaymentByIdService';
import { RefundPaymentService } from './service/RefundPaymentService';

@Module({
    providers: [
        CreatePaymentService,
        FindPaymentByReservationService,
        FindPaymentByIdService,
        RefundPaymentService,
        PaymentRepository,
        {provide: STRIPE_CLIENT,
        useFactory: () => new Stripe(env.STRIPE_SECRET_KEY ?? '', {
            apiVersion: '2025-12-15.clover',
        }),
    }],
    exports: [STRIPE_CLIENT],
    controllers: [PaymentController]
})
export class PaymentModule {}