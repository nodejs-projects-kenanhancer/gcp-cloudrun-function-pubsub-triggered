import { PubSub } from '@google-cloud/pubsub';
import { PubsubMessage } from '@google-cloud/pubsub/build/src/publisher';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AppConfiguration } from '../config';
import { APP_CONFIGURATION } from '../config';

@Injectable()
export class PubSubPublisherService {
  private readonly logger = new Logger(PubSubPublisherService.name);
  private pubSubClient: PubSub;

  constructor(
    @Inject(APP_CONFIGURATION) private readonly appConfig: AppConfiguration,
  ) {
    this.pubSubClient = new PubSub({
      projectId: this.appConfig.basicSettings.gcpProjectId,
    });
  }

  async publishMessage(
    topicName: string,
    data: Record<string, any>,
    attributes?: Record<string, string>,
  ): Promise<string> {
    try {
      const topic = this.pubSubClient.topic(topicName);

      // Convert data to Buffer
      const messageBuffer = Buffer.from(JSON.stringify(data));

      const message: PubsubMessage = {
        data: messageBuffer,
        attributes: attributes || {},
      };

      // Publish the message
      const messageId = await topic.publishMessage(message);

      this.logger.debug(`📤 Message published to ${topicName}: ${messageId}`);

      return messageId;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish message to ${topicName}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Failed to publish message to: ${String(error)}`);
      }
      throw error;
    }
  }
}
