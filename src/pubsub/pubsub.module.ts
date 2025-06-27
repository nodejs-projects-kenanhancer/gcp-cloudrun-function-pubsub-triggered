import { Module } from '@nestjs/common';
import { BigTableModule } from '../bigtable';
import { PubsubProcessorService } from './pubsub-processor.service';
import { PubSubPublisherService } from './pubsub-publisher.service';
import { PubsubController } from './pubsub.controller';

@Module({
  imports: [BigTableModule],
  controllers: [PubsubController],
  providers: [PubsubProcessorService, PubSubPublisherService],
  exports: [PubsubProcessorService, PubSubPublisherService],
})
export class PubsubModule {}
