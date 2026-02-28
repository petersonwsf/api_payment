import { Test, TestingModule } from '@nestjs/testing';
import { RefundPaymentService } from './RefundPaymentService';
import { PaymentRepository } from '../repository/PaymentRepository';
import { STRIPE_CLIENT } from 'src/config/stripe/stripe';
import { stripeMockTest } from 'src/test-utils/stripe-mock';
import { CaptureMethod, PaymentStatus } from '@prisma/client';
import { InvalidId } from '../domain/errors/InvalidId';
import { PaymentNotBelongUser } from '../domain/errors/PaymentNotBelongUser';
import { PaymentNotFound } from '../domain/errors/PaymentNotFound';
import { PaymentCannotBeRefunded } from '../domain/errors/PaymentCannotBeRefunded';

describe('Teste de pagamento reembolsado', () => {
  let service: RefundPaymentService;
  let repository: PaymentRepository;

  const data = new Date();

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
            findPaymentById: jest
              .fn()
              .mockResolvedValueOnce({
                userId: 1,
                stripePaymentIntentId: 'pi_mock_3534054309850',
                amountAuthorized: 50000,
                amountCaptured: 0,
                currency: 'brl',
                status: PaymentStatus.AUTHORIZED,
                captureMethod: CaptureMethod.MANUAL,
                createdAt: data,
                updatedAt: data,
                id: 1,
              })
              .mockResolvedValueOnce({
                userId: 50,
                stripePaymentIntentId: 'pi_mock_3534054309850',
                amountAuthorized: 50000,
                amountCaptured: 0,
                currency: 'brl',
                status: PaymentStatus.AUTHORIZED,
                captureMethod: CaptureMethod.MANUAL,
                createdAt: data,
                updatedAt: data,
                id: 1,
              })
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce({
                userId: 1,
                stripePaymentIntentId: 'pi_mock_3534054309850',
                amountAuthorized: 50000,
                amountCaptured: 0,
                currency: 'brl',
                status: PaymentStatus.AUTHORIZED,
                captureMethod: CaptureMethod.MANUAL,
                createdAt: data,
                updatedAt: data,
                id: 1,
              })
              .mockResolvedValue({
                userId: 1,
                stripePaymentIntentId: 'pi_mock_3534054309850',
                amountAuthorized: 50000,
                amountCaptured: 0,
                currency: 'brl',
                status: PaymentStatus.CAPTURED,
                captureMethod: CaptureMethod.MANUAL,
                createdAt: data,
                updatedAt: data,
                id: 1,
              }),
            update: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RefundPaymentService>(RefundPaymentService);
    repository = module.get<PaymentRepository>(PaymentRepository);
  });

  it('Caso de sucesso', async () => {
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
    const data = {
      id: 'Invalid id',
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'petz@gmail.com',
      },
    };

    await expect(service.execute(data)).rejects.toThrow(InvalidId);
  });

  it('Caso de erro: Usuário com id diferente do id associado ao pagamento', async () => {
    const data = {
      id: 1,
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'petz@gmail.com',
      },
    };

    await expect(service.execute(data)).rejects.toThrow(PaymentNotBelongUser);
  });

  it('Caso de erro: Pagamento não encontrado', async () => {
    const data = {
      id: 57,
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'petz@gmail.com',
      },
    };

    await expect(service.execute(data)).rejects.toThrow(PaymentNotFound);
  });

  it('Caso de erro: Pagamento já processado', async () => {
    const data = {
      id: 1,
      user: {
        id: 1,
        role: 'CLIENT',
        username: 'client@gmail.com',
      },
    };

    await expect(service.execute(data)).rejects.toThrow(PaymentCannotBeRefunded);
  });

  it('Caso de sucesso: Reembolso feito por admin', async () => {
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
