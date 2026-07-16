import { env } from '../config/env';
import { getS3PublicBaseUrl } from '../providers/storage/utils/file';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');
const normalizeVersionValue = (value?: unknown): string => {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return String(value.getTime());
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return '';
    }

    const parsedDate = Date.parse(trimmed);
    return Number.isNaN(parsedDate) ? trimmed : String(parsedDate);
  }

  return '';
};

const getUploadsBaseUrl = (): string => {
  if (env.PUBLIC_UPLOAD_URL) {
    return trimTrailingSlash(env.PUBLIC_UPLOAD_URL);
  }

  if (env.APP_BASE_URL) {
    return `${trimTrailingSlash(env.APP_BASE_URL)}${env.LOCAL_UPLOADS_BASE_PATH.replace(/\/+$/, '')}`;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('PUBLIC_UPLOAD_URL or BASE_URL is required to build public file URLs in production');
  }

  return `http://127.0.0.1:${env.PORT}${env.LOCAL_UPLOADS_BASE_PATH.replace(/\/+$/, '')}`;
};

const getUploadsOrigin = (): string => {
  const baseUrl = getUploadsBaseUrl();
  return new URL(baseUrl).origin;
};

export const buildPublicFileUrl = (value?: string | null): string => {
  const filePath = value?.trim();
  if (!filePath) return '';

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const uploadsBasePath = env.LOCAL_UPLOADS_BASE_PATH.replace(/^\/?/, '/').replace(/\/+$/, '');

  if (filePath.startsWith(uploadsBasePath)) {
    return `${getUploadsOrigin()}${filePath}`;
  }

  const normalizedPath = trimLeadingSlash(filePath);
  const uploadsPrefix = trimLeadingSlash(uploadsBasePath);

  if (normalizedPath === uploadsPrefix) {
    return getUploadsBaseUrl();
  }

  if (normalizedPath.startsWith(`${uploadsPrefix}/`)) {
    return `${getUploadsOrigin()}/${normalizedPath}`;
  }

  if (env.STORAGE_PROVIDER === 's3') {
    return `${getS3PublicBaseUrl()}/${normalizedPath}`;
  }

  const uploadsBaseUrl = getUploadsBaseUrl();
  return `${uploadsBaseUrl}/${normalizedPath}`;
};

export const buildVersionedPublicFileUrl = (
  value?: string | null,
  version?: unknown,
): string => {
  const baseUrl = buildPublicFileUrl(value);
  const normalizedVersion = normalizeVersionValue(version);

  if (!baseUrl || !normalizedVersion) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('v', normalizedVersion);
    return url.toString();
  } catch {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}v=${encodeURIComponent(normalizedVersion)}`;
  }
};
