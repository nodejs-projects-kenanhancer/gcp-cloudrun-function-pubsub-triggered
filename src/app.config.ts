import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

let nestAppPromise: Promise<NestExpressApplication> | null = null;

export async function getNestApp() {
  if (!nestAppPromise) {
    nestAppPromise = NestFactory.create<NestExpressApplication>(AppModule).then(
      (app) => app.init(),
    );
  }
  return nestAppPromise;
}
