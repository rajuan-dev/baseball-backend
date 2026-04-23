import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { authController } from './auth.controller';
import { authValidation } from './auth.validation';

export const authRoutes = Router();

authRoutes.post('/app/send-otp', validateRequest(authValidation.sendOtp), authController.sendAppOtp);
authRoutes.post(
  '/app/verify-otp',
  validateRequest(authValidation.verifyAppOtp),
  authController.verifyAppOtp,
);
authRoutes.get('/app/me', requireAuth('user'), authController.getAppMe);

authRoutes.post('/admin/login', validateRequest(authValidation.adminLogin), authController.loginAdmin);
authRoutes.post(
  '/admin/forgot-password',
  validateRequest(authValidation.sendOtp),
  authController.forgotAdminPassword,
);
authRoutes.post(
  '/admin/verify-otp',
  validateRequest(authValidation.verifyAdminOtp),
  authController.verifyAdminOtp,
);
authRoutes.post(
  '/admin/reset-password',
  validateRequest(authValidation.resetAdminPassword),
  authController.resetAdminPassword,
);
