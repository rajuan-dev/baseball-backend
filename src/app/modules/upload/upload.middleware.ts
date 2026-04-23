import multer from 'multer';

import { env } from '../../config/env';
import { ApiError } from '../../errors/ApiError';

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new ApiError(400, 'Only image uploads are supported'));
    return;
  }

  callback(null, true);
};

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
});
