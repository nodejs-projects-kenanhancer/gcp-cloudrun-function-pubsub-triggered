import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { AppConfiguration } from './interfaces/app-configuration.interface';

export const validationSchema = Joi.object({
  // Server Settings
  SERVER_SETTINGS__PORT: Joi.number().default(8080),
  SERVER_SETTINGS__LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info'),

  // Basic Settings
  BASIC_SETTINGS__ENVIRONMENT: Joi.string()
    .valid('dev', 'preprod', 'prod')
    .required(),
  BASIC_SETTINGS__GCP_PROJECT_ID: Joi.string().required(),
  BASIC_SETTINGS__GCP_PROJECT_NUMBER: Joi.string().required(),
  BASIC_SETTINGS__APP_CONFIG_BUCKET: Joi.string().required(),
  BASIC_SETTINGS__GCP_SERVICE_NAME: Joi.string().required(),

  // Bigtable Settings
  BIGTABLE_SETTINGS__INSTANCE_NAME: Joi.string().required(),
  BIGTABLE_SETTINGS__TABLE_NAME: Joi.string().required(),

  // Pub/Sub Settings
  PUBSUB_SETTINGS__TOPIC_NAME: Joi.string().required(),
});

export default registerAs(
  'app',
  (): AppConfiguration => ({
    serverSettings: {
      port: parseInt(process.env.SERVER_SETTINGS__PORT || '8080', 10),
      logLevel: process.env.SERVER_SETTINGS__LOG_LEVEL || 'info',
    },
    basicSettings: {
      environment: process.env.BASIC_SETTINGS__ENVIRONMENT || 'dev',
      gcpProjectId: process.env.BASIC_SETTINGS__GCP_PROJECT_ID || '',
      gcpProjectNumber: process.env.BASIC_SETTINGS__GCP_PROJECT_NUMBER || '',
      appConfigBucket: process.env.BASIC_SETTINGS__APP_CONFIG_BUCKET || '',
      gcpServiceName: process.env.BASIC_SETTINGS__GCP_SERVICE_NAME || '',
    },
    bigtableSettings: {
      instanceName: process.env.BIGTABLE_SETTINGS__INSTANCE_NAME || '',
      tableName: process.env.BIGTABLE_SETTINGS__TABLE_NAME || '',
    },
    pubsubSettings: {
      topicName: process.env.PUBSUB_SETTINGS__TOPIC_NAME || '',
    },
  }),
);
