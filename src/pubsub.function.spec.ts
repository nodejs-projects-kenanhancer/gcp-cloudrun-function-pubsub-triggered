import type { Message } from '@google/events/cloud/pubsub/v1/MessagePublishedData';
import { getNestApp } from './app.config';
import { main, pubsubLogger } from './pubsub.function';
import { PubsubProcessorService } from './pubsub/pubsub-processor.service';

// Mock the getNestApp function
jest.mock('./app.config', () => ({
  getNestApp: jest.fn(),
}));

describe('PubSub Function', () => {
  let mockPubsubService: { handleMessage: jest.Mock };
  let mockApp: { get: jest.Mock };
  let loggerErrorSpy: jest.SpyInstance;
  let handleMessageMock: jest.Mock;

  beforeEach(() => {
    handleMessageMock = jest.fn();
    // Create mock objects
    mockPubsubService = {
      handleMessage: handleMessageMock,
    };

    mockApp = {
      get: jest.fn().mockReturnValue(mockPubsubService),
    };

    // Mock the getNestApp function to return our mock app
    (getNestApp as jest.Mock).mockResolvedValue(mockApp);

    // Spy on the Logger.error method
    loggerErrorSpy = jest.spyOn(pubsubLogger, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully process a PubSub message', async () => {
    // Create a valid CloudEvent
    const validEvent: Message = {
      messageId: 'message-id-123',
      data: 'dGVzdCBtZXNzYWdl', // "test message" in base64
      publishTime: '2023-01-01T00:00:00.000Z',
    };

    // Call the function
    await main(validEvent);

    // Verify that the function got the app from getNestApp
    expect(getNestApp).toHaveBeenCalled();

    // Verify that the function got the service from the app
    expect(mockApp.get).toHaveBeenCalledWith(PubsubProcessorService);

    // Verify that the service handleMessage method was called with the event
    expect(handleMessageMock).toHaveBeenCalledWith(validEvent);

    // Verify that no errors were logged
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('should successfully process a PubSub message with complex base64 data', async () => {
    // Create a valid CloudEvent
    const data =
      'eyJpZCI6IjU2OTc2NjZiLWU3OTItNGFkMS05ZDk0LTM1MTc0ZjQwNWQ4MSIsInRvcGljIjoiYmFzdF9hY2NvdW50X2JpbGxpbmdfaG9sZF92MSIsInBhcnRpdGlvbiI6MSwib2Zmc2V0IjoiNDgxMzkiLCJ0aW1lc3RhbXAiOiIyMDI1LTA1LTE1VDA1OjEzOjQ4LjIxOFoiLCJrZXkiOiIzMDYwNDM0NiIsInZhbHVlIjp7ImhvbGRJZCI6IjQ0MDgyOCIsImFjY291bnRJZCI6IjMwNjA0MzQ2IiwiY2xpZW50SWQiOiI3NmNjYjU0OS1lNThmLTQzMDEtOGRlMS0yZGNiNDNiMTVmY2UiLCJhZ2VudElkIjoiYmljb19maW5hbF9iaWxsaW5nX2NvbnRyb2xzIiwicmVhc29uIjoiSG9sZCBkZWxldGVkIGF1dG9tYXRpY2FsbHkgYnkgZmluYWwgYmlsbGluZyBjb250cm9scyBzZXJ2aWNlIiwiYWN0aW9uIjoiRGVsZXRlZCIsImFjdGlvblRpbWVzdGFtcCI6MTc0NzI4NjAyNDk0MSwiY3VycmVudFN0YXRlIjp7ImNvbS5vdm9lbmVyZ3kua2Fma2EuYmFzdC5iaWxsaW5nLk9uSG9sZCI6eyJob2xkcyI6W3siaG9sZElkIjoiNDQwODI5IiwicmVhc29uIjoiQmlsbGluZyBDb250cm9sczogRmluYWxsZWQgLyBNaXNzaW5nIGZpbmFsIGRheSBjaGFyZ2UgKEFVVE8pIFtpZDo2ZDBmYWFiNzZiNmE5NzBmM2Y2NzIxMTIxMjRiMGRjNV0iLCJhZ2VudElkIjoiYmljb19maW5hbF9iaWxsaW5nX2NvbnRyb2xzIiwiY2xpZW50SWQiOiI3NmNjYjU0OS1lNThmLTQzMDEtOGRlMS0yZGNiNDNiMTVmY2UiLCJob2xkVGltZVN0YW1wIjoxNzQ3Mjg1OTQ1OTAxfV19fSwibWV0YWRhdGEiOnsiZXZlbnRJZCI6IjE1MDAxZTJjNTU1MmE3NTg0YTA5ZTUxY2MzMmJmY2MwYWIyNDkzMzY2ZTc3NzMyODBhMDM0ZDE1YWY4NWIyNGIiLCJjcmVhdGVkQXQiOjE3NDcyODYwMjQ5NDEsInRyYWNlVG9rZW4iOiJjOGNkMzU0NC0wYTEyLTQ2N2UtODUyNy1jYjhmOGVkODQ2MTcifX0sImhlYWRlcnMiOnt9fQ==';
    // const dataJson = JSON.parse(Buffer.from(data!, 'base64').toString('utf-8'));
    const validEvent: Message = {
      messageId: 'message-id-123',
      publishTime: '2023-01-01T00:00:00.000Z',
      data,
    };

    // Call the function
    await main(validEvent);

    // Verify that the function got the app from getNestApp
    expect(getNestApp).toHaveBeenCalled();

    // Verify that the function got the service from the app
    expect(mockApp.get).toHaveBeenCalledWith(PubsubProcessorService);

    // Verify that the service handleMessage method was called with the event
    expect(handleMessageMock).toHaveBeenCalledWith(validEvent);

    // Verify that no errors were logged
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('should log and re-throw errors when getNestApp fails', async () => {
    // Create a test error
    const testError = new Error('Test app error');

    // Make getNestApp throw an error
    (getNestApp as jest.Mock).mockRejectedValueOnce(testError);

    // Create a valid CloudEvent
    const validEvent: Message = {
      messageId: 'message-id-123',
      data: 'dGVzdCBtZXNzYWdl', // "test message" in base64
      publishTime: '2023-01-01T00:00:00.000Z',
    };

    // Call the function and expect it to throw
    await expect(main(validEvent)).rejects.toThrow(testError);

    // Verify that the error was logged
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Error processing PubSub message: Test app error',
      ),
      expect.any(String),
    );

    // Verify that the service was never called
    expect(mockPubsubService.handleMessage).not.toHaveBeenCalled();
  });

  it('should log and re-throw errors when handleMessage fails', async () => {
    // Create a test error
    const testError = new Error('Test service error');

    // Make the service throw an error
    handleMessageMock.mockImplementationOnce(() => {
      throw testError;
    });

    // Create a valid CloudEvent
    const validEvent: Message = {
      messageId: 'message-id-123',
      data: 'dGVzdCBtZXNzYWdl', // "test message" in base64
      publishTime: '2023-01-01T00:00:00.000Z',
    };

    // Call the function and expect it to throw
    await expect(main(validEvent)).rejects.toThrow(testError);

    // Verify that the error was logged
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Error processing PubSub message: Test service error',
      ),
      expect.any(String),
    );

    // Verify that the service was called
    expect(mockPubsubService.handleMessage).toHaveBeenCalledWith(validEvent);
  });

  it('should handle non-Error objects correctly when service throws', async () => {
    // Create a non-Error object
    const nonErrorObject = 'This is a string, not an Error object';

    // Make the service throw the non-Error object
    handleMessageMock.mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw nonErrorObject;
    });

    // Create a valid CloudEvent
    const validEvent: Message = {
      messageId: 'message-id-123',
      data: 'dGVzdCBtZXNzYWdl', // "test message" in base64
      publishTime: '2023-01-01T00:00:00.000Z',
    };

    // Call the function and expect it to throw
    await expect(main(validEvent)).rejects.toBe(nonErrorObject);

    // Verify that the error was logged correctly (without stack trace)
    const errorMock = loggerErrorSpy as jest.Mock<
      void,
      [message: string, trace?: string]
    >;
    expect(errorMock.mock.calls.length).toBe(1);

    // With the proper generic type for the mock, TypeScript knows the structure
    if (errorMock.mock.calls.length > 0) {
      const [message, trace] = errorMock.mock.calls[0];
      expect(message).toBe(
        `Error processing PubSub message: ${String(nonErrorObject)}`,
      );
      expect(trace).toBeUndefined();
    }

    // Verify that the service was called
    // const handleMessageMock = mockPubsubService.handleMessage as jest.Mock<
    //   Promise<void>,
    //   [CloudEvent<MessagePublishedData>]
    // >;
    expect(handleMessageMock.mock.calls.length).toBe(1);

    expect(handleMessageMock).toHaveBeenCalledWith(validEvent);
  });
});
