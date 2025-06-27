import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { APP_CONFIGURATION, AppConfigProviders } from './app-config.providers';

describe('AppConfigProviders', () => {
  let configService: ConfigService;
  const mockAppConfig = {
    port: 3000,
    environment: 'test',
    // Add other expected properties based on your AppConfiguration interface
  };

  beforeEach(async () => {
    // Create a mock ConfigService
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'app') {
                return mockAppConfig;
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(AppConfigProviders).toBeDefined();
    expect(Array.isArray(AppConfigProviders)).toBe(true);
  });

  it('should have the correct token', () => {
    const provider = AppConfigProviders[0] as FactoryProvider;
    expect(provider.provide).toBe(APP_CONFIGURATION);
  });

  it('should inject ConfigService', () => {
    const provider = AppConfigProviders[0] as FactoryProvider;
    expect(provider.inject).toEqual([ConfigService]);
  });

  it('should have a factory function', () => {
    const provider = AppConfigProviders[0] as FactoryProvider;
    expect(typeof provider.useFactory).toBe('function');
  });

  it('should call configService.get with "app" key and return the result', () => {
    const provider = AppConfigProviders[0] as FactoryProvider;
    const factory = provider.useFactory as Function;

    // Execute the factory with our mock ConfigService
    const result = factory(configService);

    // Verify ConfigService.get was called with the right parameter
    expect(configService.get).toHaveBeenCalledWith('app');
    expect(configService.get).toHaveBeenCalledTimes(1);

    // Verify factory returns what ConfigService.get returns
    expect(result).toEqual(mockAppConfig);
  });

  it('should create the correct configuration when included in a module', async () => {
    // Create a test module with our providers
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockAppConfig),
          },
        },
        ...AppConfigProviders,
      ],
    }).compile();

    // Get the configuration from the module
    const appConfig = moduleRef.get(APP_CONFIGURATION);

    // Verify the config is correct
    expect(appConfig).toEqual(mockAppConfig);
  });
});
