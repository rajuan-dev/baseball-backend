import multer from 'multer';

import { env } from '../../config/env';
import { ApiError } from '../../errors/ApiError';

const isMimeTypeAllowed = (mimeType: string) =>
  env.ALLOWED_UPLOAD_MIME_TYPES.some((allowedType) => {
    if (allowedType.endsWith('/*')) {
      return mimeType.startsWith(`${allowedType.slice(0, -1)}`);
    }

    return mimeType === allowedType;
  });

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (!isMimeTypeAllowed(file.mimetype)) {
    callback(new ApiError(400, `Only ${env.ALLOWED_UPLOAD_MIME_TYPES.join(', ')} uploads are supported`));
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
