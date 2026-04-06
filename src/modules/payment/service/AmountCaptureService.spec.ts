import { Test, TestingModule } from '@nestjs/testing';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import { stripeMockTest } from 'src/test-utils/stripe-mock';
import { AmountCaptureService } from './AmountCaptureService';
import { PaymentRepository } from '../repository/PaymentRepository';
import { CaptureMethod, PaymentStatus } from '@prisma/client';
import { Method } from '../domain/enums/Method';
import { ZodError } from 'zod';
import { AmountZero } from '../domain/errors/AmountZero.error';
import { PaymentNotFound } from '../domain/errors/PaymentNotFound';
import { PaymentNotBelongUser } from '../domain/errors/PaymentNotBelongUser';
import { PaymentAutomaticCapture } from '../domain/errors/PaymentAutomaticCapture';
import { PaymentCannotBeCaptured } from '../domain/errors/PaymentCannotBeCaptured';
import { PaymentNotAuthorized } from '../domain/errors/PaymentNotAuthorized';
import { ValueAbovePermitted } from '../domain/errors/ValueAbovePermitted';
import { StripeError } from '../domain/errors/StripeError';
import { BadRequestException } from '@nestjs/common';

describe('Teste de captura de pagamento', () => {
  let service: AmountCaptureService;
  let repository: PaymentRepository;

  const date = new Date();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmountCaptureService,
        {
          provide: STRIPE_CLIENT,
          useValue: stripeMockTest,
        },
        {
          provide: PaymentRepository,
          useValue: {
            findPaymentById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    module.useLogger(false);
    service = module.get<AmountCaptureService>(AmountCaptureService);
    repository = module.get<PaymentRepository>(PaymentRepository);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Caso de sucesso - Pagamento completo', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    jest.spyOn(repository, 'update').mockResolvedValueOnce(undefined);

    stripeMockTest.paymentIntents.capture.mockResolvedValueOnce({
      status: 'succeeded',
      amount_received: 50000,
    });

    const data = {
      id: 1,
      userId: 1,
      amount: 500,
      user: {
        role: 'CLIENT',
        username: 'cliente@gmail.com',
        id: 1,
      },
    };

    const response = await service.execute(data);

    expect(response).toMatchObject({
      amountCaptured: 50000,
      status: PaymentStatus.CAPTURED,
      id: 1,
      reservationId: 1,
      userId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      currency: 'brl',
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
    });
  });

  it('Caso de sucesso - ADMIN fazendo captura', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    jest.spyOn(repository, 'update').mockResolvedValueOnce(undefined);

    stripeMockTest.paymentIntents.capture.mockResolvedValueOnce({
      status: 'succeeded',
      amount_received: 50000,
    });

    const data = {
      id: 1,
      userId: 4,
      amount: 500,
      user: {
        role: 'ADMIN',
        username: 'admin@gmail.com',
        id: 4,
      },
    };

    const response = await service.execute(data);

    expect(response).toMatchObject({
      amountCaptured: 50000,
      status: PaymentStatus.CAPTURED,
      id: 1,
      reservationId: 1,
      userId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      currency: 'brl',
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
    });
  });

  it('Caso de sucesso - Pagamento parcial, outro deve ser criado com o novo método de pagamento', async () => {
    stripeMockTest.paymentIntents.capture.mockResolvedValueOnce({
      status: 'succeeded',
      amount_received: 40000,
    });

    stripeMockTest.paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_mock_2656546',
    });

    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    jest.spyOn(repository, 'create').mockResolvedValueOnce({
      id: 3,
      reservationId: 1,
      userId: 1,
      stripePaymentIntentId: 'pi_mock_2656546',
      amountAuthorized: 10000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.CREATED,
      captureMethod: CaptureMethod.AUTOMATIC,
      createdAt: date,
      updatedAt: date,
    });

    jest.spyOn(repository, 'update').mockResolvedValueOnce(undefined);

    const data = {
      id: 1,
      userId: 1,
      amount: 400,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    const response = await service.execute(data);

    expect(response).toMatchObject({
      amountCaptured: 0,
      status: PaymentStatus.CREATED,
      id: 3,
      reservationId: 1,
      userId: 1,
      stripePaymentIntentId: 'pi_mock_2656546',
      amountAuthorized: 10000,
      currency: 'brl',
      captureMethod: CaptureMethod.AUTOMATIC,
      createdAt: date,
      updatedAt: date,
    });
  });

  it('Caso de falha - Caso de falha de validação de dados', async () => {
    const data = {
      id: 1,
      userId: 1,
      amount: 'amount',
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(ZodError);
  });

  it('Caso de falha - Pagamento não encontrado', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce(null);

    const data = {
      id: 5,
      userId: 1,
      amount: 500,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(PaymentNotFound);
  });

  it('Caso de falha - Pagemnto Não pertence ao usuário', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    const data = {
      id: 1,
      userId: 3,
      amount: 500,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(PaymentNotBelongUser);
  });

  it('Caso de falha - Pagamento não é do tipo manual', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.AUTOMATIC,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    const data = {
      id: 1,
      userId: 1,
      amount: 500,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(
      PaymentAutomaticCapture,
    );
  });

  it('Caso de falha - Status do pagamento não permite que seja processado', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.CAPTURED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    const data = {
      id: 1,
      userId: 1,
      amount: 500,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(
      PaymentCannotBeCaptured,
    );
  });

  it('Caso de falha - Pagamento não autorizado', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.CREATED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    const data = {
      id: 1,
      userId: 1,
      amount: 500,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(PaymentNotAuthorized);
  });

  it('Caso de falha - Enviado valor 0', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    const data = {
      id: 1,
      userId: 1,
      amount: 0,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(AmountZero);
  });

  it('Caso de falha - Valor acima do pagamento', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    const data = {
      id: 1,
      userId: 1,
      amount: 600,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(ValueAbovePermitted);
  });

  it('Caso de falha - Erro de processamento da stripe', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    stripeMockTest.paymentIntents.capture.mockResolvedValueOnce({
      status: 'requires_capture',
      amount_received: 0,
    });

    const data = {
      id: 1,
      userId: 1,
      amount: 500,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
      method: Method.BOLETO,
    };

    await expect(service.execute(data)).rejects.toThrow(StripeError);
  });

  it('Caso de falha - Método de pagamento não enciado em caso de pagamento parcial', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 1,
      reservationId: 1,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.AUTHORIZED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: date,
      updatedAt: date,
      id: 1,
    });

    stripeMockTest.paymentIntents.capture.mockResolvedValueOnce({
      status: 'succeeded',
      amount_received: 40000,
    });

    const data = {
      id: 1,
      userId: 1,
      amount: 500,
      user: {
        role: 'CLIENT',
        username: 'admin@gmail.com',
        id: 1,
      },
    };

    await expect(service.execute(data)).rejects.toThrow(BadRequestException);
  });
});
