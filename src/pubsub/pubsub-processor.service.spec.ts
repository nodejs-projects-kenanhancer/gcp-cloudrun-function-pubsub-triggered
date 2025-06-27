import type { Message } from '@google/events/cloud/pubsub/v1/MessagePublishedData';
import { Test, TestingModule } from '@nestjs/testing';
import { BigTableService } from '../bigtable';
import { APP_CONFIGURATION, type AppConfiguration } from '../config';
import { PubsubProcessorService } from './pubsub-processor.service';
import { PubSubPublisherService } from './pubsub-publisher.service';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('PubsubProcessorService', () => {
  let pubsubProcessorService: PubsubProcessorService;
  let mockBigtableService: jest.Mocked<BigTableService>;
  let mockPubsubPublisherService: jest.Mocked<PubSubPublisherService>;
  let mockAppConfig: AppConfiguration;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockBigtableService = {
      insertEvent: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<BigTableService>;

    mockPubsubPublisherService = {
      publishMessage: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<PubSubPublisherService>;

    // Mock configuration
    mockAppConfig = {
      basicSettings: {
        gcpProjectId: 'test-project-id',
      },
      pubsubSettings: {
        topicName: 'test-topic',
      },
    } as AppConfiguration;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubsubProcessorService,
        {
          provide: BigTableService,
          useValue: mockBigtableService,
        },
        {
          provide: PubSubPublisherService,
          useValue: mockPubsubPublisherService,
        },
        {
          provide: APP_CONFIGURATION,
          useValue: mockAppConfig,
        },
      ],
    }).compile();

    // const module: TestingModule = await Test.createTestingModule({
    //   imports: [BigTableModule],
    //   providers: [PubsubProcessorService],
    // }).compile();

    const app = module.createNestApplication();
    await app.init(); // Trigger lifecycle hooks

    pubsubProcessorService = module.get(PubsubProcessorService);

    // Spy on the specific logger instance used by the service
    loggerLogSpy = jest
      .spyOn(pubsubProcessorService['logger'], 'log')
      .mockImplementation();
    loggerErrorSpy = jest
      .spyOn(pubsubProcessorService['logger'], 'error')
      .mockImplementation();
    loggerWarnSpy = jest
      .spyOn(pubsubProcessorService['logger'], 'warn')
      .mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(pubsubProcessorService).toBeDefined();
    });

    it('should initialize with BigTableService dependency', () => {
      // Check if the BigTableService was properly injected
      expect((pubsubProcessorService as any).bigtableService).toBeDefined();
      expect((pubsubProcessorService as any).bigtableService).toBe(
        mockBigtableService,
      );
    });

    it('should initialize with PubSubPublisherService dependency', () => {
      // Check if the PubSubPublisherService was properly injected
      expect(
        (pubsubProcessorService as any).pubsubPublisherService,
      ).toBeDefined();
      expect((pubsubProcessorService as any).pubsubPublisherService).toBe(
        mockPubsubPublisherService,
      );
    });

    it('should initialize logger', () => {
      // Check if logger is properly initialized
      expect((pubsubProcessorService as any).logger).toBeDefined();
      expect((pubsubProcessorService as any).logger.constructor.name).toBe(
        'Logger',
      );
      // Check if logger has the correct context name
      expect((pubsubProcessorService as any).logger.context).toBe(
        'PubsubProcessorService',
      );
    });
  });

  describe('handleMessage', () => {
    it('should process a valid PubSub message with base64-encoded JSON payload', async () => {
      // Create a valid CloudEvent with PubSub message containing JSON
      const data =
        'eyJpZCI6IjU2OTc2NjZiLWU3OTItNGFkMS05ZDk0LTM1MTc0ZjQwNWQ4MSIsInRvcGljIjoiYmFzdF9hY2NvdW50X2JpbGxpbmdfaG9sZF92MSIsInBhcnRpdGlvbiI6MSwib2Zmc2V0IjoiNDgxMzkiLCJ0aW1lc3RhbXAiOiIyMDI1LTA1LTE1VDA1OjEzOjQ4LjIxOFoiLCJrZXkiOiIzMDYwNDM0NiIsInZhbHVlIjp7ImhvbGRJZCI6IjQ0MDgyOCIsImFjY291bnRJZCI6IjMwNjA0MzQ2IiwiY2xpZW50SWQiOiI3NmNjYjU0OS1lNThmLTQzMDEtOGRlMS0yZGNiNDNiMTVmY2UiLCJhZ2VudElkIjoiYmljb19maW5hbF9iaWxsaW5nX2NvbnRyb2xzIiwicmVhc29uIjoiSG9sZCBkZWxldGVkIGF1dG9tYXRpY2FsbHkgYnkgZmluYWwgYmlsbGluZyBjb250cm9scyBzZXJ2aWNlIiwiYWN0aW9uIjoiRGVsZXRlZCIsImFjdGlvblRpbWVzdGFtcCI6MTc0NzI4NjAyNDk0MSwiY3VycmVudFN0YXRlIjp7ImNvbS5vdm9lbmVyZ3kua2Fma2EuYmFzdC5iaWxsaW5nLk9uSG9sZCI6eyJob2xkcyI6W3siaG9sZElkIjoiNDQwODI5IiwicmVhc29uIjoiQmlsbGluZyBDb250cm9sczogRmluYWxsZWQgLyBNaXNzaW5nIGZpbmFsIGRheSBjaGFyZ2UgKEFVVE8pIFtpZDo2ZDBmYWFiNzZiNmE5NzBmM2Y2NzIxMTIxMjRiMGRjNV0iLCJhZ2VudElkIjoiYmljb19maW5hbF9iaWxsaW5nX2NvbnRyb2xzIiwiY2xpZW50SWQiOiI3NmNjYjU0OS1lNThmLTQzMDEtOGRlMS0yZGNiNDNiMTVmY2UiLCJob2xkVGltZVN0YW1wIjoxNzQ3Mjg1OTQ1OTAxfV19fSwibWV0YWRhdGEiOnsiZXZlbnRJZCI6IjE1MDAxZTJjNTU1MmE3NTg0YTA5ZTUxY2MzMmJmY2MwYWIyNDkzMzY2ZTc3NzMyODBhMDM0ZDE1YWY4NWIyNGIiLCJjcmVhdGVkQXQiOjE3NDcyODYwMjQ5NDEsInRyYWNlVG9rZW4iOiJjOGNkMzU0NC0wYTEyLTQ2N2UtODUyNy1jYjhmOGVkODQ2MTcifX0sImhlYWRlcnMiOnt9fQ==';
      const dataJson = JSON.parse(
        Buffer.from(data, 'base64').toString('utf-8'),
      ) as Record<string, unknown>;
      const attributes = {
        messageId: '5697666b-e792-4ad1-9d94-35174f405d81',
        sourceKafkaTopic: 'bast_account_billing_hold_v1',
      };
      const validEvent: Message = {
        messageId: '14538995975168121',
        publishTime: '2025-05-15T05:13:49.502Z',
        attributes,
        data,
      };

      await pubsubProcessorService.handleMessage(validEvent);

      // Check that logger was called with the correct messages
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Received Pub/Sub message: ID=14538995975168121',
        ),
      );
      expect(loggerLogSpy).toHaveBeenCalledWith('Message Payload:', dataJson);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Message Attributes:',
        attributes,
      );
    });

    it('should process a valid PubSub message with JSON payload', async () => {
      const dataJson = {
        id: '5697666b-e792-4ad1-9d94-35174f405d81',
        topic: 'bast_account_billing_hold_v1',
        partition: 1,
        offset: '48139',
        timestamp: '2025-05-15T05:13:48.218Z',
        key: '30604346',
        value: {
          holdId: '440828',
          accountId: '30604346',
          clientId: '76ccb549-e58f-4301-8de1-2dcb43b15fce',
          agentId: 'bico_final_billing_controls',
          reason:
            'Hold deleted automatically by final billing controls service',
          action: 'Deleted',
          actionTimestamp: 1747286024941,
          currentState: {
            'com.kenanhancer.kafka.bast.billing.OnHold': {
              holds: [
                {
                  holdId: '440829',
                  reason:
                    'Billing Controls: Finalled / Missing final day charge (AUTO) [id:6d0faab76b6a970f3f672112124b0dc5]',
                  agentId: 'bico_final_billing_controls',
                  clientId: '76ccb549-e58f-4301-8de1-2dcb43b15fce',
                  holdTimeStamp: 1747285945901,
                },
              ],
            },
          },
          metadata: {
            eventId:
              '15001e2c5552a7584a09e51cc32bfcc0ab2493366e7773280a034d15af85b24b',
            createdAt: 1747286024941,
            traceToken: 'c8cd3544-0a12-467e-8527-cb8f8ed84617',
          },
        },
        headers: {},
      };
      const data = Buffer.from(JSON.stringify(dataJson)).toString('base64'); // Base64 encode the JSON string
      const attributes = {
        messageId: '5697666b-e792-4ad1-9d94-35174f405d81',
        sourceKafkaTopic: 'bast_account_billing_hold_v1',
      };
      const validEvent: Message = {
        messageId: '14538995975168121',
        publishTime: '2025-05-15T05:13:49.502Z',
        attributes,
        data,
      };

      await pubsubProcessorService.handleMessage(validEvent);

      // Check that logger was called with the correct messages
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Received Pub/Sub message: ID=14538995975168121',
        ),
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Message Payload:',
        JSON.parse(Buffer.from(data, 'base64').toString('utf-8')),
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Message Attributes:',
        attributes,
      );
    });

    it('should process a valid PubSub message with string (non-JSON) payload', () => {
      // Create a valid CloudEvent with PubSub message containing plain text
      const validEvent: Message = {
        messageId: 'message-id-123',
        data: Buffer.from('plain text message').toString('base64'),
        publishTime: '2023-01-01T00:00:00.000Z',
        attributes: { attr1: 'value1' },
      };

      pubsubProcessorService.handleMessage(validEvent);

      // It should log the message as a string since it's not valid JSON
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Message Payload:',
        'plain text message',
      );
    });

    // it('should handle missing data in CloudEvent', () => {
    //   // Use type assertion to force null data for testing
    //   const invalidEvent = {
    //     data: null,
    //   } as unknown as Message;

    //   pubsubProcessorService.handleMessage(invalidEvent);

    //   // Check that error logger was called
    //   expect(loggerErrorSpy).toHaveBeenCalledWith(
    //     'No Pub/Sub message found in cloud event data',
    //   );
    // });

    it('should handle missing message in PubSub data', async () => {
      // Create a CloudEvent with empty data structure
      const invalidEvent = {
        data: Buffer.from(JSON.stringify({})).toString('base64'), // Empty data object with no message property
      } as unknown as Message;

      await pubsubProcessorService.handleMessage(invalidEvent);

      // Check that error logger was called
      expect(loggerLogSpy).toHaveBeenCalledWith('Message Payload: (empty)');
    });

    it('should handle base64 decoding empty string warning', async () => {
      // Mock Buffer.from to throw an error when called with base64 encoding
      const originalBufferFrom = Buffer.from.bind(Buffer) as typeof Buffer.from;

      // 2️⃣  spy on Buffer.from for the duration of this test
      const bufferFromSpy = jest
        .spyOn(Buffer, 'from')
        .mockImplementation((data: string, encoding?: BufferEncoding) => {
          if (encoding === 'base64' && data === 'aaaaa') {
            return originalBufferFrom(''); // Simulate empty buffer
          }
          // use the bound original so `this` is still Buffer
          return originalBufferFrom(data, encoding);
        });

      const eventWithInvalidBase64: Message = {
        messageId: 'message-id-123',
        data: 'aaaaa', // Invalid base64 data
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      await pubsubProcessorService.handleMessage(eventWithInvalidBase64);

      expect(loggerWarnSpy).toHaveBeenCalledWith('Decoded buffer is empty');

      // 3️⃣  restore the real method so other tests aren’t affected
      bufferFromSpy.mockRestore();
    });

    it('should log error when Buffer.from throws an Error during base64 decoding', async () => {
      // Mock Buffer.from to throw an error when called with base64 encoding
      const originalBufferFrom = Buffer.from.bind(Buffer) as typeof Buffer.from;

      // 2️⃣  spy on Buffer.from for the duration of this test
      const bufferFromSpy = jest
        .spyOn(Buffer, 'from')
        .mockImplementation((data: string, encoding?: BufferEncoding) => {
          if (encoding === 'base64' && data === 'aaaaa') {
            throw new Error('Invalid base64 string format detected');
          }
          // use the bound original so `this` is still Buffer
          return originalBufferFrom(data, encoding);
        });

      const eventWithInvalidBase64: Message = {
        messageId: 'message-id-123',
        data: 'aaaaa',
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      await pubsubProcessorService.handleMessage(eventWithInvalidBase64);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Error decoding base64 data',
        'Invalid base64 string format detected',
        expect.any(String), // Stack trace
      );

      // 3️⃣  restore the real method so other tests aren’t affected
      bufferFromSpy.mockRestore();
    });

    it('should log error when Buffer.from throws a string during base64 decoding', async () => {
      // Mock Buffer.from to throw an error when called with base64 encoding
      const originalBufferFrom = Buffer.from.bind(Buffer) as typeof Buffer.from;

      // 2️⃣  spy on Buffer.from for the duration of this test
      const bufferFromSpy = jest
        .spyOn(Buffer, 'from')
        .mockImplementation((data: string, encoding?: BufferEncoding) => {
          if (encoding === 'base64' && data === 'aaaaa') {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw 'Invalid base64 string format detected';
          }
          // use the bound original so `this` is still Buffer
          return originalBufferFrom(data, encoding);
        });

      const eventWithInvalidBase64: Message = {
        messageId: 'message-id-123',
        data: 'aaaaa',
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      await pubsubProcessorService.handleMessage(eventWithInvalidBase64);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Unknown error decoding base64 data',
        'Invalid base64 string format detected',
      );

      // 3️⃣  restore the real method so other tests aren’t affected
      bufferFromSpy.mockRestore();
    });

    it('should handle base64 decoding errors', async () => {
      const eventWithInvalidBase64: Message = {
        messageId: 'message-id-123',
        data: 'invalid-base64',
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      await pubsubProcessorService.handleMessage(eventWithInvalidBase64);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Invalid base64 string format detected',
      );
    });

    it('should handle JSON parsing errors', async () => {
      const eventWithInvalidJSON: Message = {
        messageId: 'message-id-123',
        data: Buffer.from('{invalid-json}').toString('base64'), // Valid base64 but invalid JSON
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      await pubsubProcessorService.handleMessage(eventWithInvalidJSON);

      // It should still log the message but keep it as a string
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Message Payload:',
        '{invalid-json}',
      );
    });

    // it('should handle empty payload', () => {
    //   const eventWithEmptyPayload = {
    //     messageId: 'message-id-123',
    //     data: '', // Empty payload (not base64 encoded)
    //     publishTime: '2023-01-01T00:00:00.000Z',
    //   };

    //   pubsubProcessorService.handleMessage(eventWithEmptyPayload);

    //   expect(loggerErrorSpy).toHaveBeenCalledWith(
    //     'No Pub/Sub message found in cloud event data',
    //   );
    // });

    // it('should handle null payload', () => {
    //   const eventWithNullPayload: Message = {
    //     messageId: 'message-id-123',
    //     // No data property at all
    //     publishTime: '2023-01-01T00:00:00.000Z',
    //   };

    //   pubsubProcessorService.handleMessage(eventWithNullPayload);

    //   expect(loggerErrorSpy).toHaveBeenCalledWith(
    //     'No Pub/Sub message found in cloud event data',
    //   );
    // });

    it('should handle message with no attributes', async () => {
      const eventWithNoAttributes: Message = {
        messageId: 'message-id-123',
        data: Buffer.from('{"test":"value"}').toString('base64'),
        publishTime: '2023-01-01T00:00:00.000Z',
        // No attributes property
      };

      await pubsubProcessorService.handleMessage(eventWithNoAttributes);

      expect(loggerLogSpy).toHaveBeenCalledWith('Message Attributes: (none)');
    });

    it('should handle missing messageId and publishTime', async () => {
      const eventWithoutMetadata: Message = {
        // No messageId or publishTime
        data: Buffer.from('{"test":"value"}').toString('base64'),
      };

      await pubsubProcessorService.handleMessage(eventWithoutMetadata);

      // Should use default values for missing fields
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Received Pub/Sub message: ID=<unknown>, published at <unknown>',
        ),
      );
    });

    it('should handle undefined data parameter in decodeBase64Data', async () => {
      // Create a valid CloudEvent but with undefined data
      const eventWithUndefinedData: Message = {
        messageId: 'message-id-123',
        publishTime: '2023-01-01T00:00:00.000Z',
        // Explicitly set data to undefined
        data: undefined,
      };

      await pubsubProcessorService.handleMessage(eventWithUndefinedData);

      // Check that error logger was called
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Invalid base64 string format detected',
      );
    });

    it('should handle null data in parseData method', async () => {
      // We can't directly test private methods, so we'll test indirectly
      // by creating a situation where decodeBase64Data returns null but is called

      // Mock the decodeBase64Data to return null
      jest
        .spyOn<any, any>(pubsubProcessorService, 'decodeBase64Data')
        .mockReturnValueOnce(null);

      const validEvent: Message = {
        messageId: 'message-id-123',
        data: 'dGVzdA==', // valid base64 but we mock it to return null
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      // This should call parseData with null
      await pubsubProcessorService.handleMessage(validEvent);

      // We should never get to logging any payload
      expect(loggerLogSpy).not.toHaveBeenCalledWith(
        'Message Payload:',
        expect.anything(),
      );
      expect(loggerLogSpy).not.toHaveBeenCalledWith('Message Payload: (empty)');
    });

    it('should handle empty object as payload', async () => {
      // Create an event with an empty object as the JSON payload
      const eventWithEmptyObjectPayload: Message = {
        messageId: 'message-id-123',
        data: Buffer.from(JSON.stringify({})).toString('base64'), // Empty object
        publishTime: '2023-01-01T00:00:00.000Z',
      };

      await pubsubProcessorService.handleMessage(eventWithEmptyObjectPayload);

      // Should log as empty payload
      expect(loggerLogSpy).toHaveBeenCalledWith('Message Payload: (empty)');
    });
  });
});
