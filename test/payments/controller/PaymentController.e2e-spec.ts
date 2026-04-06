import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import request from 'supertest';
import { Method } from '../../../src/modules/payment/domain/enums/Method';
import { AuthGuard } from '@nestjs/passport';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe';
import { stripeMock } from '../../__mocks__/mock_stripe';
import { prisma } from 'src/lib/prisma';

describe('PaymentController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(STRIPE_CLIENT)
      .useValue(stripeMock)
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 1, username: 'test-user', role: 'ADMIN' };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();

    await prisma.payment.deleteMany();
    await prisma.stripeWebhookEvent.deleteMany();
    await prisma.$disconnect();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/payment/create - Deve retornar 201', () => {
    return request(app.getHttpServer())
      .post('/payment')
      .send({
        reservationId: 1,
        userId: 1,
        amount: 500,
        method: Method.CARTAO,
        currency: 'brl',
        customerEmail: 'petz@gmail.com',
      })
      .expect(201);
  });

  it('/payment/create - Deve retornar 400', () => {
    return request(app.getHttpServer())
      .post('/payment')
      .send({
        userId: 1,
        amount: 600,
      })
      .expect(400);
  });

  it('/payment/create - Deve retornar 400', () => {
    return request(app.getHttpServer())
      .post('/payment')
      .send({
        reservationId: 1,
        userId: 1,
        amount: 0,
        method: Method.CARTAO,
        currency: 'brl',
        customerEmail: 'petz@gmail.com',
      })
      .expect(400);
  });

  it('/payment/create - Deve retornar 500', () => {
    return request(app.getHttpServer())
      .post('/payment')
      .send({
        reservationId: 1,
        userId: 1,
        amount: 500,
        method: Method.CARTAO,
        currency: 'brl',
        customerEmail: 'petz@gmail.com',
      })
      .expect(500);
  });
});
