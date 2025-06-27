import { Module } from '@nestjs/common';
import { BigTableModule } from './bigtable';
import { AppConfigModule } from './config';
import { PubsubModule } from './pubsub';

@Module({
  imports: [AppConfigModule, BigTableModule, PubsubModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
