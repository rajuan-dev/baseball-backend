import http from 'node:http';

import mongoose from 'mongoose';

import app from './app';
import { connectDatabase } from './app/config/database';
import { env } from './app/config/env';
import { logger } from './app/logger';
import { adminService } from './app/modules/admin/admin.service';

const server = http.createServer(app);

const bootstrap = async (): Promise<void> => {
  await connectDatabase();
  await adminService.seedDefaultAdmin();

  server.listen(env.PORT, () => {
    logger.info('Server started', {
      port: env.PORT,
      env: env.NODE_ENV,
      baseUrl: `http://localhost:${env.PORT}${env.API_PREFIX}`,
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
