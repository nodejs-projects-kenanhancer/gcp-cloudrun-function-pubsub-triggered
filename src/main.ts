import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { getNestApp } from './app.config';

async function startServer() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await getNestApp(); // built once per container
    dotenv.config();
    const { SERVER_SETTINGS__PORT = 8080 } = process.env;
    await app.listen(SERVER_SETTINGS__PORT);
    logger.log(`Application is running on port: ${SERVER_SETTINGS__PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  void startServer().catch((error: unknown) => {
    const logger = new Logger('Bootstrap');
    if (error instanceof Error) {
      logger.error(`Uncaught bootstrap error: ${error.message}`, error.stack);
    } else {
      logger.error(`Uncaught bootstrap error: ${String(error)}`);
    }
    process.exit(1);
  });
}

// For GCP Cloud Functions
export { main } from './pubsub.function'; // export the main function for GCP Cloud Functions
