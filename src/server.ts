import http from 'node:http';

import mongoose from 'mongoose';

import app from './app';
import { connectDatabase } from './app/config/database';
import { env } from './app/config/env';
import { logger } from './app/logger';
import { adminService } from './app/modules/admin/admin.service';
import { bootstrapService } from './app/services/bootstrap.service';

const server = http.createServer(app);

const bootstrap = async (): Promise<void> => {
  await connectDatabase();
  await adminService.seedDefaultAdmin();
  await bootstrapService.seedApplicationData();

  server.listen(env.PORT, env.HOST, () => {
    logger.info('Server started', {
      host: env.HOST,
      port: env.PORT,
      env: env.NODE_ENV,
      baseUrl: env.APP_BASE_URL
        ? `${env.APP_BASE_URL.replace(/\/$/, '')}${env.API_PREFIX}`
        : env.API_PREFIX,
      storageProvider: env.STORAGE_PROVIDER,
      uploadMode: env.UPLOAD_MODE,
    });
  });
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.warn('Graceful shutdown started', {
    signal,
  });

  server.close(async (error) => {
    if (error) {
      logger.error('HTTP server close failed', {
        error: error.message,
      });
      process.exit(1);
    }

    await mongoose.connection.close();
    logger.info('Shutdown completed');
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason,
  });
  process.exit(1);
});

void bootstrap().catch((error: Error) => {
  logger.error('Application bootstrap failed', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
