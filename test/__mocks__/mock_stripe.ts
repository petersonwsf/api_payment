export const stripeMock = {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
          id: 'pi_mock_123',
          client_secret: 'secret_mock_123',
          status: 'require_payment_method',
        })
    },
    webhooks: {
        constructEvent: jest.fn().mockReturnValue({
        id: 'evt_mock',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_mock_123' } },
        }),
    },
}