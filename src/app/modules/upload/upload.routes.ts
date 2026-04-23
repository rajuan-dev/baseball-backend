import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';

import { uploadController } from './upload.controller';
import { uploadValidation } from './upload.validation';

export const uploadRoutes = Router();

uploadRoutes.post(
  '/presign',
  requireAuth('admin'),
  validateRequest(uploadValidation.presign),
  uploadController.createPresignedUpload,
);
