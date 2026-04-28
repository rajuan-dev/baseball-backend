import { env } from '../../config/env';

import { S3StorageProvider } from './aws/s3-storage.provider';
import { StorageProvider } from './interfaces/storage-provider.interface';
// LocalStorageProvider is intentionally disabled so uploads cannot fall back to disk.
// import { LocalStorageProvider } from './local/local-storage.provider';

let storageProvider: StorageProvider | null = null;

export const getStorageProvider = (): StorageProvider => {
  if (storageProvider) {
    return storageProvider;
  }

  if (env.STORAGE_PROVIDER !== 's3') {
    throw new Error('Local upload storage is disabled. Configure STORAGE_PROVIDER=s3 and UPLOAD_DRIVER=s3.');
  }

  storageProvider = new S3StorageProvider();

  return storageProvider;
};
