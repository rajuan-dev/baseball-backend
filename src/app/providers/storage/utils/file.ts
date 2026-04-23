import path from 'node:path';
import { randomUUID } from 'node:crypto';

const sanitizeSegment = (value: string): string => {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .filter(Boolean)
    .join('/');
};

const safeExtension = (fileName: string): string => {
  const extension = path.extname(fileName).replace('.', '').toLowerCase();
  return extension || 'bin';
};

export const buildStorageKey = (folder: string | undefined, fileName: string): string => {
  const normalizedFolder = sanitizeSegment(folder || 'general');
  return `${normalizedFolder}/${randomUUID()}.${safeExtension(fileName)}`;
};
