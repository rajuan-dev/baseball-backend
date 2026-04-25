import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';

import { dashboardController } from './dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.get('/overview', requireAuth('admin'), dashboardController.getOverview);
dashboardRoutes.get('/stats', requireAuth('admin'), dashboardController.getOverview);
