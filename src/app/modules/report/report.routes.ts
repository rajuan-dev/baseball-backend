import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { reportController } from './report.controller';
import { reportValidation } from './report.validation';

export const reportRoutes = Router();

reportRoutes.post('/', validateRequest(reportValidation.create), reportController.create);
reportRoutes.get('/', requireAuth('admin'), reportController.getAll);
reportRoutes.get('/:id', requireAuth('admin'), reportController.getById);
