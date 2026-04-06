import { Test, TestingModule } from '@nestjs/testing';
import { RefundPaymentService } from './RefundPaymentService';
import { PaymentRepository } from '../repository/PaymentRepository';
import { STRIPE_CLIENT } from 'src/common/stripe/stripe.constants';
import { stripeMockTest } from 'src/test-utils/stripe-mock';
import { CaptureMethod, PaymentStatus } from '@prisma/client';
import { InvalidId } from '../domain/errors/InvalidId';
import { PaymentNotBelongUser } from '../domain/errors/PaymentNotBelongUser';
import { PaymentNotFound } from '../domain/errors/PaymentNotFound';
import { PaymentCannotBeRefunded } from '../domain/errors/PaymentCannotBeRefunded';

describe('Teste de pagamento reembolsado', () => {
  let service: RefundPaymentService;
  let repository: PaymentRepository;

  const date = new Date();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundPaymentService,
        {
          provide: STRIPE_CLIENT,
          useValue: stripeMockTest,
        },
        {
          provide: PaymentRepository,
          useValue: {
            findPaymentById: jest.fn(),
            update: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    module.useLogger(false);
    service = module.get<RefundPaymentService>(RefundPaymentService);
    repository = module.get<PaymentRepository>(PaymentRepository);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Caso de sucesso', async () => {
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

    stripeMockTest.paymentIntents.retrieve.mockResolvedValueOnce({
      id: 'pi_mock_1',
      client_secret: 'secret',
      status: 'requires_payment_method',
    });

    const data = {
      id: 1,
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'petz@gmail.com',
      },
    };

    const result = await service.execute(data);

    expect(result).toMatchObject({
      id: data.id,
      message: 'Refund the payment succesfully processed!',
    });
  });

  it('Caso de erro: Id inválido', async () => {
    const findPaymentSpy = jest.spyOn(repository, 'findPaymentById');

    const data = {
      id: 'Invalid id',
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'petz@gmail.com',
      },
    };

    await expect(service.execute(data)).rejects.toThrow(InvalidId);

    expect(findPaymentSpy).not.toHaveBeenCalled();
  });

  it('Caso de erro: Usuário com id diferente do id associado ao pagamento', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce({
      userId: 50,
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

    const updateSpy = jest.spyOn(repository, 'update');

    const data = {
      id: 1,
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'petz@gmail.com',
      },
    };

    await expect(service.execute(data)).rejects.toThrow(PaymentNotBelongUser);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('Caso de erro: Pagamento não encontrado', async () => {
    jest.spyOn(repository, 'findPaymentById').mockResolvedValueOnce(null);

    const updateSpy = jest.spyOn(repository, 'update');

    const data = {
      id: 57,
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'petz@gmail.com',
      },
    };

    await expect(service.execute(data)).rejects.toThrow(PaymentNotFound);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('Caso de erro: Pagamento já processado', async () => {
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

    stripeMockTest.paymentIntents.retrieve.mockResolvedValueOnce({
      id: 'pi_mock_1',
      client_secret: 'secret',
      status: 'succeeded',
    });

    const updateSpy = jest.spyOn(repository, 'update');

    const data = {
      id: 1,
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'client@gmail.com',
      },
    };

    await expect(service.execute(data)).rejects.toThrow(
      PaymentCannotBeRefunded,
    );

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('Caso de sucesso: Reembolso feito por admin', async () => {
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

    stripeMockTest.paymentIntents.retrieve.mockResolvedValueOnce({
      id: 'pi_mock_1',
      client_secret: 'secret',
      status: 'requires_payment_method',
    });

    const data = {
      id: 1,
      user: {
        id: 10,
        role: 'ADMIN',
        username: 'admin@admin.com',
      },
    };

    const result = await service.execute(data);

    expect(result).toMatchObject({
      id: data.id,
      message: 'Refund the payment succesfully processed!',
    });
  });
});
