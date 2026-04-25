import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { situationController } from './situation.controller';
import { situationValidation } from './situation.validation';

export const situationRoutes = Router();

situationRoutes.get('/', situationController.getAll);
situationRoutes.get('/:id', situationController.getById);
situationRoutes.post(
  '/',
  requireAuth('admin'),
  validateRequest(situationValidation.save),
  situationController.create,
);
situationRoutes.patch(
  '/:id',
  requireAuth('admin'),
  validateRequest(situationValidation.save),
  situationController.update,
);
situationRoutes.delete('/:id', requireAuth('admin'), situationController.remove);
