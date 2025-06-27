import type { Message } from '@google/events/cloud/pubsub/v1/MessagePublishedData';
import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { PubsubProcessorService } from './pubsub-processor.service';

@Controller('pubsub')
export class PubsubController {
  private readonly logger = new Logger(PubsubController.name);

  constructor(private readonly pubsubService: PubsubProcessorService) {}

  @Post('test')
  @HttpCode(204)
  async testPubsub(@Body() event: Message) {
    try {
      // Use the service to handle the PubSub message
      await this.pubsubService.handleMessage(event);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(
          `Error handling Pub/Sub event: ${err.message}`,
          err.stack,
        );
      } else {
        this.logger.error(`Error handling Pub/Sub event: ${String(err)}`);
      }

      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
