import {
  StorageProvider,
  StoredFileResult,
  UploadDescriptor,
} from '../interfaces/storage-provider.interface';

// Local disk storage is intentionally disabled. The previous implementation is
// left commented out in git history; S3 must be used for all active uploads.

export class LocalStorageProvider implements StorageProvider {
  readonly providerName = 'local' as const;

  readonly supportsPresignedUploads = false;

  async storeFile(_input: UploadDescriptor & { buffer: Buffer }): Promise<StoredFileResult> {
    throw new Error('Local upload storage is disabled. Use STORAGE_PROVIDER=s3.');
  }

  async deleteFile(_keyOrUrl: string): Promise<void> {
    throw new Error('Local upload storage is disabled. Use STORAGE_PROVIDER=s3.');
  }
}
