import configuration, { validationSchema } from './configuration';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Backup original env vars and create a clean environment for testing
    jest.resetModules();
    process.env = { ...originalEnv };

    // Set required environment variables to mock values
    process.env.BASIC_SETTINGS__ENVIRONMENT = 'dev';
    process.env.BASIC_SETTINGS__GCP_PROJECT_ID = 'test-project';
    process.env.BASIC_SETTINGS__GCP_PROJECT_NUMBER = '123456789';
    process.env.BASIC_SETTINGS__APP_CONFIG_BUCKET = 'test-bucket';
    process.env.BASIC_SETTINGS__GCP_SERVICE_NAME = 'test-service';
    process.env.BIGTABLE_SETTINGS__INSTANCE_NAME = 'test-instance';
    process.env.BIGTABLE_SETTINGS__TABLE_NAME = 'test-table';
    process.env.PUBSUB_SETTINGS__TOPIC_NAME = 'test-topic';
  });

  afterEach(() => {
    // Restore original env vars
    process.env = originalEnv;
  });

  describe('validationSchema', () => {
    it('should be a Joi schema object', () => {
      expect(validationSchema).toBeInstanceOf(Object);
      expect(validationSchema.validate).toBeDefined();
    });

    it('should validate required fields', () => {
      // Test with missing required fields
      const { error: missingEnvError } = validationSchema.validate({
        // Missing BASIC_SETTINGS__ENVIRONMENT
        BASIC_SETTINGS__GCP_PROJECT_ID: 'test-project',
        BASIC_SETTINGS__GCP_PROJECT_NUMBER: '123456789',
        BASIC_SETTINGS__APP_CONFIG_BUCKET: 'test-bucket',
        BASIC_SETTINGS__GCP_SERVICE_NAME: 'test-service',
        BIGTABLE_SETTINGS__INSTANCE_NAME: 'test-instance',
        BIGTABLE_SETTINGS__TABLE_NAME: 'test-table',
        PUBSUB_SETTINGS__TOPIC_NAME: 'test-topic',
      });
      expect(missingEnvError).toBeDefined();

      // Test with all required fields
      const { error: noError } = validationSchema.validate({
        BASIC_SETTINGS__ENVIRONMENT: 'dev',
        BASIC_SETTINGS__GCP_PROJECT_ID: 'test-project',
        BASIC_SETTINGS__GCP_PROJECT_NUMBER: '123456789',
        BASIC_SETTINGS__APP_CONFIG_BUCKET: 'test-bucket',
        BASIC_SETTINGS__GCP_SERVICE_NAME: 'test-service',
        BIGTABLE_SETTINGS__INSTANCE_NAME: 'test-instance',
        BIGTABLE_SETTINGS__TABLE_NAME: 'test-table',
        PUBSUB_SETTINGS__TOPIC_NAME: 'test-topic',
      });
      expect(noError).toBeUndefined();
    });

    it('should enforce valid environment values', () => {
      const { error: invalidEnvError } = validationSchema.validate({
        BASIC_SETTINGS__ENVIRONMENT: 'invalid', // Not a valid environment
        BASIC_SETTINGS__GCP_PROJECT_ID: 'test-project',
        BASIC_SETTINGS__GCP_PROJECT_NUMBER: '123456789',
        BASIC_SETTINGS__APP_CONFIG_BUCKET: 'test-bucket',
        BASIC_SETTINGS__GCP_SERVICE_NAME: 'test-service',
        BIGTABLE_SETTINGS__INSTANCE_NAME: 'test-instance',
        BIGTABLE_SETTINGS__TABLE_NAME: 'test-table',
        PUBSUB_SETTINGS__TOPIC_NAME: 'test-topic',
      });
      expect(invalidEnvError).toBeDefined();
    });

    it('should enforce valid log level values', () => {
      const { error: invalidLogLevelError } = validationSchema.validate({
        SERVER_SETTINGS__LOG_LEVEL: 'invalid', // Not a valid log level
        BASIC_SETTINGS__ENVIRONMENT: 'dev',
        BASIC_SETTINGS__GCP_PROJECT_ID: 'test-project',
        BASIC_SETTINGS__GCP_PROJECT_NUMBER: '123456789',
        BASIC_SETTINGS__APP_CONFIG_BUCKET: 'test-bucket',
        BASIC_SETTINGS__GCP_SERVICE_NAME: 'test-service',
        BIGTABLE_SETTINGS__INSTANCE_NAME: 'test-instance',
        BIGTABLE_SETTINGS__TABLE_NAME: 'test-table',
        PUBSUB_SETTINGS__TOPIC_NAME: 'test-topic',
      });
      expect(invalidLogLevelError).toBeDefined();
    });

    it('should apply default values', () => {
      const { value } = validationSchema.validate({
        // Not providing SERVER_SETTINGS__PORT or SERVER_SETTINGS__LOG_LEVEL
        BASIC_SETTINGS__ENVIRONMENT: 'dev',
        BASIC_SETTINGS__GCP_PROJECT_ID: 'test-project',
        BASIC_SETTINGS__GCP_PROJECT_NUMBER: '123456789',
        BASIC_SETTINGS__APP_CONFIG_BUCKET: 'test-bucket',
        BASIC_SETTINGS__GCP_SERVICE_NAME: 'test-service',
        BIGTABLE_SETTINGS__INSTANCE_NAME: 'test-instance',
        BIGTABLE_SETTINGS__TABLE_NAME: 'test-table',
        PUBSUB_SETTINGS__TOPIC_NAME: 'test-topic',
      });

      expect(value.SERVER_SETTINGS__PORT).toBe(8080);
      expect(value.SERVER_SETTINGS__LOG_LEVEL).toBe('info');
    });
  });

  describe('configuration factory', () => {
    it('should return a function', () => {
      expect(typeof configuration).toBe('function');
    });

    it('should return a properly structured AppConfiguration object', () => {
      const config = configuration();

      expect(config).toHaveProperty('serverSettings');
      expect(config).toHaveProperty('basicSettings');
      expect(config).toHaveProperty('bigtableSettings');

      expect(config.serverSettings).toHaveProperty('port');
      expect(config.serverSettings).toHaveProperty('logLevel');

      expect(config.basicSettings).toHaveProperty('environment');
      expect(config.basicSettings).toHaveProperty('gcpProjectId');
      expect(config.basicSettings).toHaveProperty('gcpProjectNumber');
      expect(config.basicSettings).toHaveProperty('appConfigBucket');
      expect(config.basicSettings).toHaveProperty('gcpServiceName');

      expect(config.bigtableSettings).toHaveProperty('instanceName');
      expect(config.bigtableSettings).toHaveProperty('tableName');

      expect(config.pubsubSettings).toHaveProperty('topicName');
    });

    it('should use environment variables when provided', () => {
      // Set specific values for testing
      process.env.SERVER_SETTINGS__PORT = '9000';
      process.env.SERVER_SETTINGS__LOG_LEVEL = 'debug';
      process.env.BASIC_SETTINGS__ENVIRONMENT = 'preprod';

      const config = configuration();

      expect(config.serverSettings.port).toBe(9000);
      expect(config.serverSettings.logLevel).toBe('debug');
      expect(config.basicSettings.environment).toBe('preprod');
    });

    it('should use default values when environment variables are not provided', () => {
      // Remove specific environment variables to test defaults
      delete process.env.SERVER_SETTINGS__PORT;
      delete process.env.SERVER_SETTINGS__LOG_LEVEL;

      const config = configuration();

      expect(config.serverSettings.port).toBe(8080);
      expect(config.serverSettings.logLevel).toBe('info');
    });

    it('should parse the port as an integer', () => {
      process.env.SERVER_SETTINGS__PORT = '3000';
      const config = configuration();
      expect(config.serverSettings.port).toBe(3000);
      expect(typeof config.serverSettings.port).toBe('number');
    });
  });
});
