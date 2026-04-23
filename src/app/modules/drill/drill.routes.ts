import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { drillController } from './drill.controller';
import { drillValidation } from './drill.validation';

export const drillRoutes = Router();

drillRoutes.get('/', drillController.getAll);
drillRoutes.get('/:id', drillController.getById);
drillRoutes.post('/', requireAuth('admin'), validateRequest(drillValidation.save), drillController.create);
drillRoutes.patch('/:id', requireAuth('admin'), validateRequest(drillValidation.save), drillController.update);
drillRoutes.delete('/:id', requireAuth('admin'), drillController.remove);
