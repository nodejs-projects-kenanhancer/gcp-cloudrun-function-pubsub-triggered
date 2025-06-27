import type { Message } from '@google/events/cloud/pubsub/v1/MessagePublishedData';
import { Logger } from '@nestjs/common';
import { getNestApp } from './app.config';
import { PubsubProcessorService } from './pubsub/pubsub-processor.service';

export const pubsubLogger = new Logger('PubsubFunction');

export interface CloudEventFunction<T = unknown> {
  (cloudEvent: T): any;
}

export const main: CloudEventFunction<Message> = async (
  cloudEvent: Message,
) => {
  try {
    const app = await getNestApp();
    const pubsubService = app.get(PubsubProcessorService);
    pubsubLogger.log('RAW EVENT ↓\n' + JSON.stringify(cloudEvent, null, 2));
    await pubsubService.handleMessage(cloudEvent);
  } catch (error: unknown) {
    // Type check the error before accessing properties
    if (error instanceof Error) {
      pubsubLogger.error(
        `Error processing PubSub message: ${error.message}`,
        error.stack,
      );
    } else {
      // Handle case where error might not be an Error object
      pubsubLogger.error(`Error processing PubSub message: ${String(error)}`);
    }
    throw error; // Re-throw to signal failure to Cloud Functions
  }
};
