import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { settingsController } from './settings.controller';
import { settingsValidation } from './settings.validation';

export const settingsRoutes = Router();

settingsRoutes.get('/public/app', settingsController.getPublicAppSettings);
settingsRoutes.get('/public/legal', settingsController.getLegalPages);

settingsRoutes.get('/admin/content', requireAuth('admin'), settingsController.getAdminSettings);
settingsRoutes.patch(
  '/admin/content/:section',
  requireAuth('admin'),
  validateRequest(settingsValidation.updateContent),
  settingsController.updateContentSection,
);
settingsRoutes.patch(
  '/admin/app',
  requireAuth('admin'),
  validateRequest(settingsValidation.updateAppSettings),
  settingsController.updateAppSettings,
);
