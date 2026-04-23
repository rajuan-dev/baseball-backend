import mongoose from 'mongoose';

import { connectDatabase } from '../app/config/database';
import { adminService } from '../app/modules/admin/admin.service';
import { logger } from '../app/logger';
import { bootstrapService } from '../app/services/bootstrap.service';

const run = async (): Promise<void> => {
  await connectDatabase();
  await adminService.seedDefaultAdmin();
  await bootstrapService.seedApplicationData();
  await mongoose.connection.close();
  logger.info('Seed script completed');
};

void run().catch(async (error: Error) => {
  logger.error('Admin seed failed', {
    error: error.message,
    stack: error.stack,
  });

  await mongoose.connection.close();
  process.exit(1);
});
