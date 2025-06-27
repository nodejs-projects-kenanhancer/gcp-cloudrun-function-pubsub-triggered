import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_CONFIGURATION, AppConfigProviders } from './app-config.providers';
import configuration, { validationSchema } from './configuration';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [...AppConfigProviders],
  exports: [APP_CONFIGURATION],
})
export class AppConfigModule {}
