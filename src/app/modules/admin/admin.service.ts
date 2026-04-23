import { env } from '../../config/env';
import { logger } from '../../logger';

import { Admin } from './admin.model';

const seedDefaultAdmin = async (): Promise<void> => {
  const existingAdmin = await Admin.findOne({
    email: env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
  });

  if (existingAdmin) {
    logger.info('Admin seed skipped', {
      email: env.DEFAULT_ADMIN_EMAIL,
    });
    return;
  }

  await Admin.create({
    name: env.DEFAULT_ADMIN_NAME,
    email: env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
    password: env.DEFAULT_ADMIN_PASSWORD,
    role: 'super_admin',
  });

  logger.info('Default admin created', {
    email: env.DEFAULT_ADMIN_EMAIL,
  });
};

export const adminService = {
  seedDefaultAdmin,
};
