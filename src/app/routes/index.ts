import { Router } from 'express';

import { healthRoutes } from '../modules/health/health.routes';

export const router = Router();

router.use('/health', healthRoutes);
