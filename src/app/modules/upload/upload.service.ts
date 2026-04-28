import { ApiError } from '../../errors/ApiError';
import { env } from '../../config/env';
import { storageService } from '../../services/storage.service';

const createPresignedUpload = async (payload: {
  fileName: string;
  contentType: string;
  folder?: string;
}) => {
  return storageService.createUploadTarget(payload);
};

const uploadFile = async (payload: {
  file?: Express.Multer.File;
  folder?: string;
}) => {
  if (!payload.file) {
    throw new ApiError(400, 'File is required');
  }

  return storageService.storeFile({
    fileName: payload.file.originalname,
    contentType: payload.file.mimetype,
    folder: payload.folder,
    buffer: payload.file.buffer,
    size: payload.file.size,
  });
};

const getProviderStatus = async () => {
  const appBaseUrl = env.APP_BASE_URL?.replace(/\/$/, '') ?? null;
  // Local uploads are disabled; provider status should not advertise disk-backed media.
  const localUploadsBasePath = null;

  return {
    ...storageService.getProviderSummary(),
    activeMode: env.UPLOAD_MODE,
    appBaseUrl,
    localUploadsBasePath,
    localFileBaseUrl: null,
    maxUploadFileSizeMb: env.MAX_UPLOAD_FILE_SIZE_MB,
  };
};

export const uploadService = {
  createPresignedUpload,
  uploadFile,
  getProviderStatus,
};
