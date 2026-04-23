import { Request } from 'express';

const SENSITIVE_FIELDS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
]);

const MAX_STRING_LENGTH = 500;
const REDACTED_VALUE = '[REDACTED]';

const truncateString = (value: string): string => {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED ${value.length - MAX_STRING_LENGTH} chars]`;
};

const sanitizeInternal = (value: unknown, seen: WeakSet<object>): unknown => {
  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return `[BUFFER ${value.length} bytes]`;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInternal(item, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[CIRCULAR]';
    }

    seen.add(value);

    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        output[key] = REDACTED_VALUE;
        continue;
      }

      output[key] = sanitizeInternal(nestedValue, seen);
    }

    seen.delete(value);
    return output;
  }

  return String(value);
};

export const sanitizeForLogging = (value: unknown): unknown => {
  return sanitizeInternal(value, new WeakSet<object>());
};

const pickFileMetadata = (file: Express.Multer.File | Record<string, unknown>): Record<string, unknown> => {
  return sanitizeForLogging({
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    encoding: file.encoding,
    size: file.size,
    filename: 'filename' in file ? file.filename : undefined,
    path: 'path' in file ? file.path : undefined,
    destination: 'destination' in file ? file.destination : undefined,
    location: 'location' in file ? file.location : undefined,
    key: 'key' in file ? file.key : undefined,
  }) as Record<string, unknown>;
};

export const getUploadedFilesMetadata = (req: Request): unknown => {
  const fileRequest = req as Request & {
    file?: Express.Multer.File;
    files?:
      | Express.Multer.File[]
      | Record<string, Express.Multer.File | Express.Multer.File[]>;
  };

  if (fileRequest.file) {
    return pickFileMetadata(fileRequest.file);
  }

  if (Array.isArray(fileRequest.files)) {
    return fileRequest.files.map((file) => pickFileMetadata(file));
  }

  if (fileRequest.files && typeof fileRequest.files === 'object') {
    const entries = Object.entries(fileRequest.files).map(([field, value]) => [
      field,
      Array.isArray(value)
        ? value.map((file) => pickFileMetadata(file))
        : pickFileMetadata(value),
    ]);

    return Object.fromEntries(entries);
  }

  return null;
};
