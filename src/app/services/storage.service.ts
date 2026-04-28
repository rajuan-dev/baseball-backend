import { ApiError } from '../errors/ApiError';
import { logger } from '../logger';
import { getStorageProvider } from '../providers/storage';
import {
  StoredFileResult,
  UploadDescriptor,
  UploadTargetResult,
} from '../providers/storage/interfaces/storage-provider.interface';

const storageProvider = getStorageProvider();

const storeFile = async (
  input: UploadDescriptor & { buffer: Buffer; size: number },
): Promise<StoredFileResult> => {
  const result = await storageProvider.storeFile(input);

  logger.info('File stored successfully', {
    provider: result.provider,
    mode: result.mode,
    key: result.key,
    fileUrl: result.fileUrl,
    contentType: input.contentType,
    size: input.size,
    folder: input.folder || 'general',
  });

  return result;
};

const createUploadTarget = async (input: UploadDescriptor): Promise<UploadTargetResult> => {
  if (!storageProvider.createUploadTarget) {
    throw new ApiError(400, `Storage provider ${storageProvider.providerName} does not support presigned uploads`);
  }

  const result = await storageProvider.createUploadTarget(input);

  logger.info('Upload target generated', {
    provider: result.provider,
    mode: result.mode,
    key: result.key,
    fileUrl: result.fileUrl,
    folder: input.folder || 'general',
  });

  return result;
};

const deleteFile = async (keyOrUrl?: string | null): Promise<void> => {
  if (!keyOrUrl?.trim()) return;

  await storageProvider.deleteFile(keyOrUrl);

  logger.info('File delete requested', {
    provider: storageProvider.providerName,
    keyOrUrl,
  });
};

const deleteFileIfChanged = async (
  previousKeyOrUrl?: string | null,
  nextKeyOrUrl?: string | null,
): Promise<void> => {
  if (!previousKeyOrUrl?.trim()) return;
  if (previousKeyOrUrl === nextKeyOrUrl) return;

  try {
    await deleteFile(previousKeyOrUrl);
  } catch (error) {
    logger.warn('Stored file cleanup failed', {
      provider: storageProvider.providerName,
      keyOrUrl: previousKeyOrUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const getProviderSummary = () => ({
  provider: storageProvider.providerName,
  supportsPresignedUploads: storageProvider.supportsPresignedUploads,
});

export const storageService = {
  getProviderSummary,
  storeFile,
  createUploadTarget,
  deleteFile,
  deleteFileIfChanged,
};
