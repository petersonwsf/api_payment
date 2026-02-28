import { Test, TestingModule } from "@nestjs/testing";
import { CreatePaymentService } from "./CreatePaymentService";
import { PaymentRepository } from "../repository/PaymentRepository";
import { STRIPE_CLIENT } from "src/config/stripe/stripe";
import { stripeMockTest } from "../../../test-utils/stripe-mock";
import { CaptureMethod, PaymentStatus } from "@prisma/client";
import { Method } from "../domain/enums/Method";
import { Currency } from "../domain/enums/Currency";

describe('CreatePaymentService', () => {
  let service: CreatePaymentService;
  let repository: PaymentRepository;

  const data = new Date();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentService,
        {
          provide: STRIPE_CLIENT,
          useValue: stripeMockTest,
        },
        {
          provide: PaymentRepository,
          useValue: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              reservationId: 101,
              userId: 50,
              stripePaymentIntentId: 'pi_mock_3534054309850',
              amountAuthorized: 50000,
              amountCaptured: 0,
              currency: 'brl',
              status: PaymentStatus.CREATED,
              captureMethod: CaptureMethod.MANUAL,
              createdAt: data,
              updatedAt: data,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CreatePaymentService>(CreatePaymentService);
    repository = module.get<PaymentRepository>(PaymentRepository);

    jest.clearAllMocks();
  });

  it('Deve processar com sucesso', async () => {

    const saveSpy = jest.spyOn(repository, 'create');

    const paymentData = {
      reservationId: 101,
      userId: 50,
      amount: 500,
      method: Method.CARTAO,
      currency: Currency.BRL,
      customerEmail: 'petz@gmail.com',
    };

    const result = await service.execute(paymentData);

    expect(result).toMatchObject({
      clientSecret: 'secret_33564367',
      reservationId: 101,
      userId: 50,
      stripePaymentIntentId: 'pi_mock_3534054309850',
      amountAuthorized: 50000,
      amountCaptured: 0,
      currency: 'brl',
      status: PaymentStatus.CREATED,
      captureMethod: CaptureMethod.MANUAL,
      createdAt: data,
      updatedAt: data,
      id: 1,
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reservationId: 101,
        userId: 50,
        stripePaymentIntentId: 'pi_mock_3534054309850',
        amountAuthorized: 50000,
        amountCaptured: 0,
        status: PaymentStatus.CREATED,
        captureMethod: CaptureMethod.MANUAL,
      }),
    );
  });

  it('Deve retornar 400 - Erro de validação de dados', async () => {
    const saveSpy = jest.spyOn(repository, 'create');

    const paymentData = {
      reservationId: 'ivndkfgfd',
      userId: 50,
      amount: 5,
    } as any;

    await expect(service.execute(paymentData)).rejects.toThrow();

    expect(stripeMockTest.paymentIntents.create).not.toHaveBeenCalled();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('Deve retornar 400 - Erro de Valor 0', async () => {
    const saveSpy = jest.spyOn(repository, 'create');

    const paymentData = {
      reservationId: 101,
      userId: 50,
      method: Method.CARTAO,
      captureMethod: CaptureMethod.MANUAL,
      amount: 0,
    };

    await expect(service.execute(paymentData)).rejects.toThrow();

    expect(stripeMockTest.paymentIntents.create).not.toHaveBeenCalled();

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
