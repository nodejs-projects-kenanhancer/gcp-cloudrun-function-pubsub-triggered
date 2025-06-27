import { Bigtable } from '@google-cloud/bigtable';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { AppConfiguration } from '../config';
import { APP_CONFIGURATION, BigtableSettings } from '../config';

@Injectable()
export class BigTableService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BigTableService.name);
  private bigtable: Bigtable;
  private instance;
  private table;
  private readonly bigtableSettings: BigtableSettings;

  constructor(
    @Inject(APP_CONFIGURATION) private readonly appConfig: AppConfiguration,
  ) {
    this.bigtable = new Bigtable();
    this.bigtableSettings = this.appConfig.bigtableSettings;
  }

  async onModuleInit() {
    try {
      this.logger.log(
        `Initializing connection to Bigtable instance: ${this.bigtableSettings.instanceName}, table: ${this.bigtableSettings.tableName}`,
      );
      this.instance = this.bigtable.instance(
        this.bigtableSettings.instanceName,
      );
      this.table = this.instance.table(this.bigtableSettings.tableName);

      const [exists] = await this.table.exists();
      if (exists) {
        this.logger.log(
          `Connected to Bigtable table: ${this.bigtableSettings.tableName}`,
        );
      } else {
        this.logger.warn(
          `Table ${this.bigtableSettings.tableName} does not exist - please ensure it is created`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Bigtable connection', error);
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Cleaning up Bigtable connections');
      await this.bigtable.close();
      this.logger.log('Bigtable connection closed successfully');
    } catch (error) {
      this.logger.error('Error during Bigtable cleanup', error);
    }
  }

  async insertEvent(
    rowKey: string,
    dataFamily: Record<string, any>,
    metaFamily: Record<string, any>,
  ) {
    try {
      // Format data
      const formattedMetaFamily = Object.entries(metaFamily).reduce(
        (acc, [key, value]) => {
          acc[key] = Buffer.from(
            typeof value === 'string' ? value : JSON.stringify(value),
          );
          return acc;
        },
        {},
      );

      const formattedDataFamily = Object.entries(dataFamily).reduce(
        (acc, [key, value]) => {
          acc[key] = Buffer.from(
            typeof value === 'string' ? value : JSON.stringify(value),
          );
          return acc;
        },
        {},
      );

      const row = {
        key: rowKey,
        data: {
          meta: formattedMetaFamily,
          data: formattedDataFamily,
        },
      };

      await this.table.insert([row]);
      this.logger.log(`Event saved to Bigtable with row key: ${rowKey}`);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error saving event to Bigtable: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Error saving event to Bigtable: ${String(error)}`);
      }
      return false;
    }
  }
}
