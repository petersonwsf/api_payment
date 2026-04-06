import { Module } from '@nestjs/common';
import { PaymentController } from './controller/PaymentController';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import { CreatePaymentService } from './service/CreatePaymentService';
import { env } from 'process';
import { PaymentRepository } from './repository/PaymentRepository';
import { FindPaymentByReservationService } from './service/FindPaymentByReservationService';
import { FindPaymentByIdService } from './service/FindPaymentByIdService';
import { RefundPaymentService } from './service/RefundPaymentService';
import { AmountCaptureService } from './service/AmountCaptureService';
import { PaymentService } from './service/PaymentService';
import { AuthModule } from '../auth/AuthModule';
import { CardPayment } from './strategies/CardPayment';
import { BoletoPayment } from './strategies/BoletoPayment';

@Module({
  providers: [
    CreatePaymentService,
    FindPaymentByReservationService,
    FindPaymentByIdService,
    RefundPaymentService,
    AmountCaptureService,
    PaymentService,
    PaymentRepository,
    CardPayment,
    BoletoPayment,
    {
      provide: STRIPE_CLIENT,
      useFactory: () =>
        new Stripe(env.STRIPE_SECRET_KEY ?? '', {
          apiVersion: '2025-12-15.clover',
        }),
    },
  ],
  imports: [AuthModule],
  exports: [STRIPE_CLIENT],
  controllers: [PaymentController],
})
export class PaymentModule {}
