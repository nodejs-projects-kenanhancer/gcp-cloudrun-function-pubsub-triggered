import { Module } from '@nestjs/common';
import { BigTableService } from './bigtable.service';

@Module({
  providers: [BigTableService],
  exports: [BigTableService],
})
export class BigTableModule {}
