export type UploadDescriptor = {
  fileName: string;
  contentType: string;
  folder?: string;
};

export type StoredFileResult = {
  provider: 'local' | 's3';
  mode: 'server' | 'presigned';
  key: string;
  fileUrl: string;
};

export type UploadTargetResult = StoredFileResult & {
  uploadUrl: string;
  expiresInSeconds?: number;
};

export interface StorageProvider {
  readonly providerName: 'local' | 's3';
  readonly supportsPresignedUploads: boolean;
  storeFile(input: UploadDescriptor & { buffer: Buffer }): Promise<StoredFileResult>;
  createUploadTarget?(input: UploadDescriptor): Promise<UploadTargetResult>;
}
