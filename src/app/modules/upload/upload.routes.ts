import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { uploadController } from './upload.controller';
import { uploadMiddleware } from './upload.middleware';
import { uploadValidation } from './upload.validation';

export const uploadRoutes = Router();

uploadRoutes.get(
  '/provider',
  requireAuth('admin'),
  uploadController.getProviderStatus,
);

uploadRoutes.post(
  '/file',
  requireAuth('admin'),
  uploadMiddleware.single('file'),
  validateRequest(uploadValidation.uploadFile),
  uploadController.uploadFile,
);

uploadRoutes.post(
  '/presign',
  requireAuth('admin'),
  validateRequest(uploadValidation.presign),
  uploadController.createPresignedUpload,
);
