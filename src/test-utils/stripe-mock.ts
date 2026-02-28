export const stripeMockTest = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_mock_3534054309850',
      client_secret: 'secret_33564367',
    }),
    retrieve: jest.fn(),
    cancel: jest.fn().mockResolvedValue({}),
  },
};
