import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { drillCategoryController } from './drill-category.controller';
import { drillCategoryValidation } from './drill-category.validation';

export const drillCategoryRoutes = Router();

drillCategoryRoutes.get('/', drillCategoryController.getAll);
drillCategoryRoutes.get('/:id', drillCategoryController.getById);
drillCategoryRoutes.post(
  '/',
  requireAuth('admin'),
  validateRequest(drillCategoryValidation.save),
  drillCategoryController.create,
);
drillCategoryRoutes.patch(
  '/:id',
  requireAuth('admin'),
  validateRequest(drillCategoryValidation.save),
  drillCategoryController.update,
);
drillCategoryRoutes.delete('/:id', requireAuth('admin'), drillCategoryController.remove);
