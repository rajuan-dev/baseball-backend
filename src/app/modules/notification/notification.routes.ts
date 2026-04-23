import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';

import { notificationController } from './notification.controller';

export const notificationRoutes = Router();

notificationRoutes.get('/', requireAuth('admin'), notificationController.getAll);
