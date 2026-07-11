import { Router } from 'express';

import { revenueCatController } from './revenuecat.controller';

export const revenueCatRoutes = Router();

revenueCatRoutes.post('/webhook', revenueCatController.webhook);
