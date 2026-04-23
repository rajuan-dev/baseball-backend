import { env } from '../../config/env';

import { S3StorageProvider } from './aws/s3-storage.provider';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './local/local-storage.provider';

let storageProvider: StorageProvider | null = null;

export const getStorageProvider = (): StorageProvider => {
  if (storageProvider) {
    return storageProvider;
  }

  storageProvider =
    env.STORAGE_PROVIDER === 's3'
      ? new S3StorageProvider()
      : new LocalStorageProvider();

  return storageProvider;
};
