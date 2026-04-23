import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { adminController } from './admin.controller';

const createAdminSchema = z.object({
  body: z
    .object({
      name: z.string().min(2),
      email: z.email(),
      password: z.string().min(8),
      confirmPassword: z.string().min(8).optional(),
      image: z.string().min(1),
      contactNo: z.string().min(5),
    })
    .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.email(),
    image: z.string().min(1),
    contactNo: z.string().min(5),
  }),
});

const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(8),
      newPassword: z.string().min(8),
      confirmPassword: z.string().min(8),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const adminRoutes = Router();

adminRoutes.post('/', requireAuth('admin'), validateRequest(createAdminSchema), adminController.createAdmin);
adminRoutes.get('/me', requireAuth('admin'), adminController.getProfile);
adminRoutes.patch(
  '/me',
  requireAuth('admin'),
  validateRequest(updateProfileSchema),
  adminController.updateProfile,
);
adminRoutes.patch(
  '/me/password',
  requireAuth('admin'),
  validateRequest(changePasswordSchema),
  adminController.changePassword,
);
