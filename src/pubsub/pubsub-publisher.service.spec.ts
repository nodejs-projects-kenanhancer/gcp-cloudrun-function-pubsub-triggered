import { Test, TestingModule } from '@nestjs/testing';
import { APP_CONFIGURATION } from '../config';
import { PubSubPublisherService } from './pubsub-publisher.service';

// Mock functions to control behavior
const mockPublishMessageFn = jest.fn();
const mockTopicFn = jest.fn();

// Mock PubSub
jest.mock('@google-cloud/pubsub', () => {
  return {
    PubSub: jest.fn().mockImplementation(() => {
      return {
        topic: mockTopicFn,
      };
    }),
  };
});

describe('PubSubPublisherService', () => {
  let pubSubService: PubSubPublisherService;
  let mockAppConfig: any;
  let debugSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Reset mocks
    mockTopicFn.mockReset();
    mockPublishMessageFn.mockReset();

    // Mock topic function to return an object with publishMessage
    mockTopicFn.mockReturnValue({
      publishMessage: mockPublishMessageFn,
    });

    // Mock configuration
    mockAppConfig = {
      basicSettings: {
        gcpProjectId: 'test-project-id',
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubSubPublisherService,
        {
          provide: APP_CONFIGURATION,
          useValue: mockAppConfig,
        },
      ],
    }).compile();

    pubSubService = module.get<PubSubPublisherService>(PubSubPublisherService);

    // Create spy for Logger methods
    debugSpy = jest
      .spyOn(pubSubService['logger'], 'debug')
      .mockImplementation(() => {});
    errorSpy = jest
      .spyOn(pubSubService['logger'], 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize PubSub with correct project ID', () => {
      expect(pubSubService).toBeDefined();
      expect((pubSubService as any).pubSubClient).toBeDefined();
      // Check if PubSub was initialized with the correct project ID
      expect(require('@google-cloud/pubsub').PubSub).toHaveBeenCalledWith({
        projectId: mockAppConfig.basicSettings.gcpProjectId,
      });
    });
  });

  describe('publishMessage', () => {
    const topicName = 'test-topic';
    const messageData = { field1: 'value1', field2: { nested: 'value' } };
    const messageAttributes = { attr1: 'value1', attr2: 'value2' };
    const expectedMessageId = 'test-message-id-123';

    beforeEach(() => {
      // Clear spy call history
      debugSpy.mockClear();
      errorSpy.mockClear();
    });

    it('should successfully publish a message to the topic', async () => {
      // Setup mock to return a message ID
      mockPublishMessageFn.mockResolvedValueOnce(expectedMessageId);

      const result = await pubSubService.publishMessage(
        topicName,
        messageData,
        messageAttributes,
      );

      // Verify topic was retrieved with correct name
      expect(mockTopicFn).toHaveBeenCalledWith(topicName);

      // Verify message was published with correct data and attributes
      expect(mockPublishMessageFn).toHaveBeenCalledWith({
        data: Buffer.from(JSON.stringify(messageData)),
        attributes: messageAttributes,
      });

      // Verify correct message ID was returned
      expect(result).toBe(expectedMessageId);

      // Verify logging
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `📤 Message published to ${topicName}: ${expectedMessageId}`,
        ),
      );
    });

    it('should use empty object when attributes are not provided', async () => {
      // Setup mock to return a message ID
      mockPublishMessageFn.mockResolvedValueOnce(expectedMessageId);

      await pubSubService.publishMessage(topicName, messageData);

      // Verify message was published with empty attributes
      expect(mockPublishMessageFn).toHaveBeenCalledWith({
        data: Buffer.from(JSON.stringify(messageData)),
        attributes: {},
      });
    });

    it('should handle Error objects when publishing fails', async () => {
      // Setup mock to throw an Error
      const testError = new Error('Publish failed');
      mockPublishMessageFn.mockRejectedValueOnce(testError);

      // Attempt to publish should throw the error
      await expect(
        pubSubService.publishMessage(topicName, messageData),
      ).rejects.toThrow(testError);

      // Verify error was logged correctly
      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to publish message to ${topicName}: ${testError.message}`,
        testError.stack,
      );
    });

    it('should handle non-Error exceptions when publishing fails', async () => {
      // Setup mock to throw a non-Error value
      const nonErrorValue = 'String error';
      mockPublishMessageFn.mockRejectedValueOnce(nonErrorValue);

      // Attempt to publish should throw the original value
      await expect(
        pubSubService.publishMessage(topicName, messageData),
      ).rejects.toBe(nonErrorValue);

      // Verify error was logged correctly
      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to publish message to: ${nonErrorValue}`,
      );
    });

    it('should properly convert message data to Buffer', async () => {
      // Setup mock implementation that captures the passed message
      mockPublishMessageFn.mockImplementationOnce((message) => {
        // Verify the message data is a Buffer
        expect(Buffer.isBuffer(message.data)).toBe(true);

        // Verify the Buffer contains the correct JSON data
        const dataString = message.data.toString();
        const parsedData = JSON.parse(dataString);
        expect(parsedData).toEqual(messageData);

        return Promise.resolve(expectedMessageId);
      });

      await pubSubService.publishMessage(topicName, messageData);

      // Verify the mock was called
      expect(mockPublishMessageFn).toHaveBeenCalled();
    });
  });
});
