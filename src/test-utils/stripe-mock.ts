export const stripeMockTest = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_mock_3534054309850',
      client_secret: 'secret_33564367',
    }),
    retrieve: jest
      .fn()
      .mockResolvedValueOnce({
        id: 'pi_mock_3534054309850',
        client_secret: 'secret_33564367',
        status: 'requires_payment_method',
      })
      .mockResolvedValueOnce({
        id: 'pi_mock_3534054309850',
        client_secret: 'secret_33564367',
        status: 'successed',
      })
      .mockResolvedValue({
        id: 'pi_mock_3534054309850',
        client_secret: 'secret_33564367',
        status: 'requires_payment_method',
      }),
    cancel: jest.fn().mockResolvedValue({}),
  },
};

/*
{
  id: "pi_123",
  object: "payment_intent",
  amount: 500,
  currency: "brl",
  status: "succeeded",
  client_secret: "pi_123_secret_abc",
  metadata: {},
  created: 1718050000,

  lastResponse: {
    headers: { ... },
    requestId: "req_abc",
    statusCode: 200
  }
}
*/
