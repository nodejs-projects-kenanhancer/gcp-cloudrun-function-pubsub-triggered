import type { Message } from '@google/events/cloud/pubsub/v1/MessagePublishedData';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BigTableService } from '../bigtable';
import type { AppConfiguration } from '../config';
import { APP_CONFIGURATION } from '../config';
import { PubSubPublisherService } from './pubsub-publisher.service';

@Injectable()
export class PubsubProcessorService {
  private readonly logger = new Logger(PubsubProcessorService.name);

  constructor(
    private readonly bigtableService: BigTableService,
    private readonly pubsubPublisherService: PubSubPublisherService,
    @Inject(APP_CONFIGURATION) private readonly appConfig: AppConfiguration,
  ) {}

  async handleMessage(cloudEventMessage: Message) {
    const pubsubMessage = cloudEventMessage.data;

    const decodedData = this.decodeBase64Data(pubsubMessage);
    if (decodedData === null) {
      return; // Error already logged in decode method
    }

    const payload = this.parseData(decodedData);

    const messageId = cloudEventMessage.messageId ?? '<unknown>';
    const publishTime = cloudEventMessage.publishTime ?? '<unknown>';
    const attributes = cloudEventMessage.attributes ?? {};

    this.logger.log(
      `Received Pub/Sub message: ID=${messageId}, published at ${String(publishTime)}`,
    );

    // Log the results
    this.logMessageDetails(payload, attributes);

    await this.saveEventToBigTable(payload, attributes);
  }

  private async saveEventToBigTable(
    payload: any,
    attributes: Record<string, string>,
  ): Promise<void> {
    if (typeof payload !== 'object' || payload === null) {
      this.logger.error('Payload is not a valid JSON object');
      return;
    }

    const timestamp = Date.now();
    const eventId = payload.eventId || uuidv4();
    const rowKey = `${eventId}-${timestamp}`;

    const metaFamily = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: '0',
      source: attributes.source || 'pubsub',
    };

    const dataFamily = {
      eventBody: JSON.stringify(payload),
      eventId: eventId,
      eventType: attributes.eventType || 'UNKNOWN',
    };

    await this.bigtableService.insertEvent(rowKey, dataFamily, metaFamily);

    await this.pubsubPublisherService.publishMessage(
      this.appConfig.pubsubSettings.topicName,
      payload,
      {
        ...attributes,
        eventId: eventId,
      },
    );
  }

  private isValidBase64(str: string | undefined): boolean {
    if (!str) return false;
    // This regex checks for a valid base64 string
    return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
  }

  private decodeBase64Data(data: string | undefined): string | null {
    if (!this.isValidBase64(data)) {
      this.logger.error('Invalid base64 string format detected');
      return null;
    }

    try {
      const buffer = Buffer.from(data!, 'base64');
      if (!buffer.length) {
        this.logger.warn('Decoded buffer is empty');
        return null;
      }
      return buffer.toString('utf-8');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          'Error decoding base64 data',
          error.message,
          error.stack,
        );
      } else {
        this.logger.error('Unknown error decoding base64 data', String(error));
      }
      return null;
    }
  }

  private parseData(data: string): unknown {
    try {
      return JSON.parse(data);
    } catch {
      // Return as string if not valid JSON
      return data;
    }
  }

  private logMessageDetails(
    payload: unknown,
    attributes: Record<string, string>,
  ): void {
    // Check if payload is effectively empty
    const isEmptyPayload =
      payload === null ||
      payload === '' ||
      (typeof payload === 'object' &&
        payload !== null &&
        Object.keys(payload).length === 0);

    if (isEmptyPayload) {
      this.logger.log('Message Payload: (empty)');
    } else {
      this.logger.log('Message Payload:', payload);
    }

    if (Object.keys(attributes).length > 0) {
      this.logger.log('Message Attributes:', attributes);
    } else {
      this.logger.log('Message Attributes: (none)');
    }
  }
}
