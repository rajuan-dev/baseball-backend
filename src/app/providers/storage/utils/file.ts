import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { env } from '../../../config/env';

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

const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const tryParseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

export const getS3PublicBaseUrl = (): string => {
  if (env.AWS_S3_PUBLIC_BASE_URL) {
    return trimTrailingSlash(env.AWS_S3_PUBLIC_BASE_URL);
  }

  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
};

export const extractS3Key = (keyOrUrl: string): string | null => {
  const value = keyOrUrl.trim();
  if (!value) return null;

  const url = tryParseUrl(value);
  if (!url) {
    const localUploadsBasePath = env.LOCAL_UPLOADS_BASE_PATH.replace(/^\/?/, '/').replace(/\/+$/, '');
    if (value.startsWith(localUploadsBasePath)) return null;
    return trimLeadingSlash(value);
  }

  const configuredBaseUrl = tryParseUrl(getS3PublicBaseUrl());
  if (configuredBaseUrl && url.origin === configuredBaseUrl.origin) {
    const configuredBasePath = trimLeadingSlash(configuredBaseUrl.pathname);
    const pathName = trimLeadingSlash(url.pathname);

    if (configuredBasePath && pathName.startsWith(`${configuredBasePath}/`)) {
      return pathName.slice(configuredBasePath.length + 1);
    }

    return pathName;
  }

  if (env.AWS_S3_BUCKET && url.hostname.startsWith(`${env.AWS_S3_BUCKET}.s3`)) {
    return trimLeadingSlash(url.pathname);
  }

  if (env.AWS_S3_BUCKET && trimLeadingSlash(url.pathname).startsWith(`${env.AWS_S3_BUCKET}/`)) {
    return trimLeadingSlash(url.pathname).slice(env.AWS_S3_BUCKET.length + 1);
  }

  return null;
};

export const extractLocalKey = (keyOrUrl: string): string | null => {
  const value = keyOrUrl.trim();
  if (!value) return null;

  const uploadsBasePath = env.LOCAL_UPLOADS_BASE_PATH.replace(/^\/?/, '/').replace(/\/+$/, '');
  const uploadsPrefix = trimLeadingSlash(uploadsBasePath);
  const url = tryParseUrl(value);
  const pathName = url ? url.pathname : value;
  const normalizedPath = trimLeadingSlash(pathName);

  if (normalizedPath === uploadsPrefix) return null;
  if (normalizedPath.startsWith(`${uploadsPrefix}/`)) {
    return normalizedPath.slice(uploadsPrefix.length + 1);
  }

  if (url) return null;
  return normalizedPath;
};
