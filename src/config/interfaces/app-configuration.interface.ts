import { BasicSettings } from './basic-settings.interface';
import { BigtableSettings } from './bigtable-settings.interface';
import { PubsubSettings } from './pubsub-settings.interface';
import { ServerSettings } from './server-settings.interface';

export interface AppConfiguration {
  serverSettings: ServerSettings;
  basicSettings: BasicSettings;
  bigtableSettings: BigtableSettings;
  pubsubSettings: PubsubSettings;
}
