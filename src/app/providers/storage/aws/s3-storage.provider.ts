import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '../../../config/env';

import {
  StorageProvider,
  StoredFileResult,
  UploadDescriptor,
  UploadTargetResult,
} from '../interfaces/storage-provider.interface';
import { buildStorageKey } from '../utils/file';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const getPublicUrl = (key: string): string => {
  const baseUrl =
    env.AWS_S3_PUBLIC_BASE_URL ||
    `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;

  return `${baseUrl.replace(/\/$/, '')}/${key}`;
};

export class S3StorageProvider implements StorageProvider {
  readonly providerName = 's3' as const;

  readonly supportsPresignedUploads = true;

  private createPutCommand(key: string, contentType: string): PutObjectCommand {
    return new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
  }

  async storeFile(input: UploadDescriptor & { buffer: Buffer }): Promise<StoredFileResult> {
    const key = buildStorageKey(input.folder, input.fileName);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        ContentType: input.contentType,
        Body: input.buffer,
      }),
    );

    return {
      provider: this.providerName,
      mode: 'server',
      key,
      fileUrl: getPublicUrl(key),
    };
  }

  async createUploadTarget(input: UploadDescriptor): Promise<UploadTargetResult> {
    const key = buildStorageKey(input.folder, input.fileName);
    const expiresInSeconds = 300;
    const uploadUrl = await getSignedUrl(
      s3Client,
      this.createPutCommand(key, input.contentType),
      { expiresIn: expiresInSeconds },
    );

    return {
      provider: this.providerName,
      mode: 'presigned',
      key,
      fileUrl: getPublicUrl(key),
      uploadUrl,
      expiresInSeconds,
    };
  }
}
