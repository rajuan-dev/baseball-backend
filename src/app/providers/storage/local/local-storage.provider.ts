import fs from 'node:fs/promises';
import path from 'node:path';

import { env } from '../../../config/env';
import { localUploadsRoot } from '../../../config/paths';

import {
  StorageProvider,
  StoredFileResult,
  UploadDescriptor,
} from '../interfaces/storage-provider.interface';
import { buildStorageKey } from '../utils/file';

const getLocalBaseUrl = (): string => {
  if (env.LOCAL_FILE_BASE_URL) {
    return env.LOCAL_FILE_BASE_URL.replace(/\/$/, '');
  }

  const appBaseUrl = env.APP_BASE_URL || `http://localhost:${env.PORT}`;
  return `${appBaseUrl.replace(/\/$/, '')}${env.LOCAL_UPLOADS_BASE_PATH.replace(/\/$/, '')}`;
};

const writeFileToDisk = async (key: string, buffer: Buffer): Promise<void> => {
  const absolutePath = path.join(localUploadsRoot, key);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);
};

export class LocalStorageProvider implements StorageProvider {
  readonly providerName = 'local' as const;

  readonly supportsPresignedUploads = false;

  async storeFile(input: UploadDescriptor & { buffer: Buffer }): Promise<StoredFileResult> {
    const key = buildStorageKey(input.folder, input.fileName);
    await writeFileToDisk(key, input.buffer);

    return {
      provider: this.providerName,
      mode: 'server',
      key,
      fileUrl: `${getLocalBaseUrl()}/${key}`.replace(/([^:]\/)\/+/g, '$1'),
    };
  }
}
