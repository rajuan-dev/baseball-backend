import { env } from '../config/env';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');

const getUploadsBaseUrl = (): string => {
  if (env.LOCAL_FILE_BASE_URL) {
    return trimTrailingSlash(env.LOCAL_FILE_BASE_URL);
  }

  if (env.APP_BASE_URL) {
    return `${trimTrailingSlash(env.APP_BASE_URL)}${env.LOCAL_UPLOADS_BASE_PATH.replace(/\/+$/, '')}`;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('LOCAL_FILE_BASE_URL or APP_BASE_URL is required to build public file URLs in production');
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

  const uploadsBaseUrl = getUploadsBaseUrl();
  const uploadsBasePath = env.LOCAL_UPLOADS_BASE_PATH.replace(/^\/?/, '/').replace(/\/+$/, '');

  if (filePath.startsWith(uploadsBasePath)) {
    return `${getUploadsOrigin()}${filePath}`;
  }

  const normalizedPath = trimLeadingSlash(filePath);
  const uploadsPrefix = trimLeadingSlash(uploadsBasePath);

  if (normalizedPath === uploadsPrefix) {
    return uploadsBaseUrl;
  }

  if (normalizedPath.startsWith(`${uploadsPrefix}/`)) {
    return `${getUploadsOrigin()}/${normalizedPath}`;
  }

  return `${uploadsBaseUrl}/${normalizedPath}`;
};
