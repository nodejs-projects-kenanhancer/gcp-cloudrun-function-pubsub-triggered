import type { Message } from '@google/events/cloud/pubsub/v1/MessagePublishedData';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PubsubProcessorService } from './pubsub-processor.service';
import { PubsubController } from './pubsub.controller';

describe('PubsubController', () => {
  let pubsubController: PubsubController;
  let pubsubProcessorService: PubsubProcessorService;
  let loggerErrorSpy: jest.SpyInstance;
  let handleMessageMock: jest.Mock;

  beforeEach(async () => {
    handleMessageMock = jest.fn().mockReturnValue(undefined);
    // Create a mock version of PubsubProcessorService
    const mockPubsubService = {
      handleMessage: handleMessageMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PubsubController],
      providers: [
        {
          provide: PubsubProcessorService,
          useValue: mockPubsubService,
        },
      ],
    }).compile();

    pubsubController = module.get(PubsubController);
    pubsubProcessorService = module.get(PubsubProcessorService);

    // Spy on the logger methods
    loggerErrorSpy = jest
      .spyOn(pubsubController['logger'], 'error')
      .mockImplementation();
  });

  describe('PubsubController Constructor', () => {
    it('should create pubsubController instance with injected dependencies', () => {
      // Instantiate pubsubController directly to test the constructor
      const pubsubController = new PubsubController(pubsubProcessorService);

      // Verify pubsubController is defined
      expect(pubsubController).toBeDefined();
      expect(pubsubController).toBeInstanceOf(PubsubController);
    });

    it('should have logger initialized', () => {
      // Instantiate pubsubController
      const pubsubController = new PubsubController(pubsubProcessorService);

      // Access the private logger property using bracket notation
      const logger = pubsubController['logger'];

      // Check that logger exists and has expected methods
      expect(logger).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('testPubsub', () => {
    it('should call pubsubProcessorService.handleMessage with valid CloudEvent', async () => {
      // Create a valid CloudEvent
      const validEvent: Message = {
        messageId: 'message-id-123',
        data: 'dGVzdCBtZXNzYWdl', // "test message" in base64
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      await pubsubController.testPubsub(validEvent);

      // Verify that the service method was called with the event
      expect(handleMessageMock).toHaveBeenCalledWith(validEvent);
    });

    it('should throw HttpException when CloudEvent is missing id', async () => {
      // CloudEvent missing id
      const invalidEvent = {
        messageId: 'message-id-123',
      } as unknown as Message;

      const testError = new Error('Invalid CloudEvent payload');
      jest
        .spyOn(pubsubProcessorService, 'handleMessage')
        .mockRejectedValueOnce(testError);

      await expect(pubsubController.testPubsub(invalidEvent)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
      expect(handleMessageMock).toHaveBeenCalled();
    });

    it('should throw HttpException when CloudEvent is missing source', async () => {
      // CloudEvent missing source
      const invalidEvent = {
        messageId: 'message-id-123',
      } as unknown as Message;

      const testError = new Error('Invalid CloudEvent payload');
      jest
        .spyOn(pubsubProcessorService, 'handleMessage')
        .mockRejectedValueOnce(testError);

      await expect(pubsubController.testPubsub(invalidEvent)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
      expect(handleMessageMock).toHaveBeenCalled();
    });

    it('should throw HttpException when CloudEvent is missing type', async () => {
      // CloudEvent missing type
      const invalidEvent = {
        messageId: 'message-id-123',
      } as unknown as Message;

      const testError = new Error('Invalid CloudEvent payload');
      jest
        .spyOn(pubsubProcessorService, 'handleMessage')
        .mockRejectedValueOnce(testError);

      await expect(pubsubController.testPubsub(invalidEvent)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
      expect(handleMessageMock).toHaveBeenCalled();
    });

    it('should throw HttpException when CloudEvent is missing data.message', async () => {
      // CloudEvent missing data.message
      const invalidEvent = {
        data: {}, // Empty data object with no message property
      } as unknown as Message;

      const testError = new Error('Invalid CloudEvent payload');
      jest
        .spyOn(pubsubProcessorService, 'handleMessage')
        .mockRejectedValueOnce(testError);

      await expect(() =>
        pubsubController.testPubsub(invalidEvent),
      ).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
      expect(handleMessageMock).toHaveBeenCalled();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Error handling Pub/Sub event: ${testError.message}`,
        testError.stack,
      );
    });

    it('should throw HttpException when CloudEvent has null data', async () => {
      // CloudEvent with null data
      const invalidEvent = {
        data: null,
      } as unknown as Message;

      const testError = new Error('Invalid CloudEvent payload');
      jest
        .spyOn(pubsubProcessorService, 'handleMessage')
        .mockRejectedValueOnce(testError);

      await expect(() =>
        pubsubController.testPubsub(invalidEvent),
      ).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
      expect(handleMessageMock).toHaveBeenCalled();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Error handling Pub/Sub event: ${testError.message}`,
        testError.stack,
      );
    });

    it('should handle Error instances correctly when PubsubProcessorService throws', async () => {
      // Create a valid CloudEvent
      const validEvent: Message = {
        messageId: 'message-id-123',
        data: 'dGVzdCBtZXNzYWdl', // "test message" in base64
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      // Make the service throw an Error
      const testError = new Error('Internal Server Error');
      jest
        .spyOn(pubsubProcessorService, 'handleMessage')
        .mockRejectedValueOnce(testError);

      // jest.spyOn(pubsubProcessorService, 'handleMessage').mockImplementationOnce(() => {
      //   throw testError;
      // });

      // expect(() => pubsubController.testPubsub(validEvent)).toThrow(
      //   new HttpException(
      //     'Internal Server Error',
      //     HttpStatus.INTERNAL_SERVER_ERROR,
      //   ),
      // );

      await expect(pubsubController.testPubsub(validEvent)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      // Verify Logger.error was called with the error message and stack trace
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Error handling Pub/Sub event: ${testError.message}`,
        testError.stack,
      );
    });

    it('should handle non-Error objects correctly when PubsubProcessorService throws', async () => {
      // Create a valid CloudEvent
      const validEvent: Message = {
        messageId: 'message-id-123',
        data: 'dGVzdCBtZXNzYWdl', // "test message" in base64
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      // Make the service throw a non-Error object (e.g., a string)
      const nonError = 'This is not an Error object';
      jest
        .spyOn(pubsubProcessorService, 'handleMessage')
        .mockRejectedValueOnce(nonError);

      // Test asenkron metodun reddedilmesini bekle
      await expect(pubsubController.testPubsub(validEvent)).rejects.toThrow(
        new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      // Verify Logger.error was called with the stringified error
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Error handling Pub/Sub event: ${String(nonError)}`,
      );
    });
  });
});
