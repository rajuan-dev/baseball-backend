import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { paymentController } from './payment.controller';
import { paymentValidation } from './payment.validation';

export const paymentRoutes = Router();

paymentRoutes.get('/transactions', requireAuth('admin'), paymentController.getAll);
paymentRoutes.get('/summary', requireAuth('admin'), paymentController.getSummary);
paymentRoutes.post(
  '/complete',
  requireAuth('admin'),
  validateRequest(paymentValidation.completePurchase),
  paymentController.completePurchase,
);
paymentRoutes.patch(
  '/price',
  requireAuth('admin'),
  validateRequest(paymentValidation.updatePrice),
  paymentController.updatePrice,
);
