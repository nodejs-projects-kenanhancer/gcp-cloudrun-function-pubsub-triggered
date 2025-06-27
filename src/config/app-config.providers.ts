import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from './interfaces/app-configuration.interface';

export const APP_CONFIGURATION = Symbol('APP_CONFIGURATION');

export const AppConfigProviders: Provider[] = [
  {
    provide: APP_CONFIGURATION,
    useFactory: (configService: ConfigService) =>
      configService.get<AppConfiguration>('app'),
    inject: [ConfigService],
  },
];
