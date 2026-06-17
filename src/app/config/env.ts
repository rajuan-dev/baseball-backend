import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const emptyStringToUndefined = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess((value) => {
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    return value;
  }, schema);

const uploadDriverSchema = z.literal('s3').default('s3');
const uploadModeSchema = z.preprocess((value) => {
  if (value === 's3') {
    return 'server';
  }

  return value;
}, z.enum(['server', 'presigned']).default('server'));

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const normalizeBasePath = (value: string) => `/${value.replace(/^\/+|\/+$/g, '')}`;
const splitCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizedEnv = (() => {
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  const uploadsBasePath = normalizeBasePath(
    process.env.LOCAL_UPLOADS_BASE_PATH || process.env.UPLOAD_BASE_PATH || '/uploads',
  );
  const baseUrl = process.env.BASE_URL || process.env.APP_BASE_URL;
  const normalizedBaseUrl = baseUrl ? trimTrailingSlash(baseUrl) : undefined;

  return {
    ...process.env,
    API_PREFIX: apiPrefix,
    BASE_URL: normalizedBaseUrl,
    APP_BASE_URL: normalizedBaseUrl,
    API_BASE_URL:
      process.env.API_BASE_URL ||
      (normalizedBaseUrl ? `${normalizedBaseUrl}${apiPrefix}` : undefined),
    UPLOAD_DRIVER: process.env.UPLOAD_DRIVER || process.env.STORAGE_PROVIDER,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || process.env.UPLOAD_DRIVER,
    // Local upload env aliases are intentionally ignored while S3 is the only active provider.
    // UPLOAD_DIR: process.env.UPLOAD_DIR || process.env.LOCAL_UPLOADS_DIR,
    // LOCAL_UPLOADS_DIR: process.env.LOCAL_UPLOADS_DIR || process.env.UPLOAD_DIR,
    LOCAL_UPLOADS_BASE_PATH: uploadsBasePath,
    PUBLIC_UPLOAD_URL:
      process.env.PUBLIC_UPLOAD_URL ||
      process.env.LOCAL_FILE_BASE_URL ||
      (normalizedBaseUrl ? `${normalizedBaseUrl}${uploadsBasePath}` : undefined),
    LOCAL_FILE_BASE_URL:
      process.env.LOCAL_FILE_BASE_URL ||
      process.env.PUBLIC_UPLOAD_URL ||
      (normalizedBaseUrl ? `${normalizedBaseUrl}${uploadsBasePath}` : undefined),
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || process.env.DEFAULT_ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD,
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
  };
})();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(5000),
    API_PREFIX: z.string().default('/api/v1'),
    BASE_URL: emptyStringToUndefined(
      z.string().url('BASE_URL must be a valid URL').optional(),
    ),
    API_BASE_URL: emptyStringToUndefined(
      z.string().url('API_BASE_URL must be a valid URL').optional(),
    ),
    APP_BASE_URL: emptyStringToUndefined(
      z.string().url('APP_BASE_URL must be a valid URL').optional(),
    ),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    MONGODB_DNS_FALLBACK_SERVERS: z
      .string()
      .default('1.1.1.1,8.8.8.8')
      .transform(splitCsv),
    LOG_LEVEL: z.string().default('info'),
    CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000').transform(splitCsv),
    DEFAULT_ADMIN_NAME: z.string().min(1, 'DEFAULT_ADMIN_NAME is required'),
    ADMIN_EMAIL: z.email('ADMIN_EMAIL must be a valid email'),
    ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
    DEFAULT_ADMIN_EMAIL: z.email('DEFAULT_ADMIN_EMAIL must be a valid email'),
    DEFAULT_ADMIN_PASSWORD: z.string().min(8, 'DEFAULT_ADMIN_PASSWORD must be at least 8 characters'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    OTP_EXPIRES_MINUTES: z.coerce.number().int().positive().default(10),
    STORAGE_PROVIDER: uploadDriverSchema,
    UPLOAD_MODE: uploadModeSchema,
    UPLOAD_DRIVER: uploadDriverSchema,
    // Local disk upload config is disabled. Keep the schema fields only so old env files do not break parsing.
    UPLOAD_DIR: z.string().default('storage/uploads'),
    LOCAL_UPLOADS_DIR: z.string().default('storage/uploads'),
    LOCAL_UPLOADS_BASE_PATH: z.string().default('/uploads'),
    PUBLIC_UPLOAD_URL: emptyStringToUndefined(
      z.string().url('PUBLIC_UPLOAD_URL must be a valid URL').optional(),
    ),
    LOCAL_FILE_BASE_URL: emptyStringToUndefined(
      z.string().url('LOCAL_FILE_BASE_URL must be a valid URL').optional(),
    ),
    MAX_UPLOAD_FILE_SIZE_MB: z.coerce.number().int().positive().default(5),
    ALLOWED_UPLOAD_MIME_TYPES: z.string().default('image/*,video/*').transform(splitCsv),
    AWS_REGION: emptyStringToUndefined(z.string().optional()),
    AWS_S3_BUCKET: emptyStringToUndefined(z.string().optional()),
    AWS_ACCESS_KEY_ID: emptyStringToUndefined(z.string().optional()),
    AWS_SECRET_ACCESS_KEY: emptyStringToUndefined(z.string().optional()),
    AWS_S3_PUBLIC_BASE_URL: emptyStringToUndefined(
      z.string().url('AWS_S3_PUBLIC_BASE_URL must be a valid URL').optional(),
    ),
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
    RESEND_FROM_EMAIL: z.email('RESEND_FROM_EMAIL must be a valid email'),
  })
  .superRefine((value, ctx) => {
    if (value.STORAGE_PROVIDER !== value.UPLOAD_DRIVER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['UPLOAD_DRIVER'],
        message: 'UPLOAD_DRIVER must match STORAGE_PROVIDER',
      });
    }

    if (value.UPLOAD_MODE === 'presigned' && value.STORAGE_PROVIDER !== 's3') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['UPLOAD_MODE'],
        message: 'UPLOAD_MODE=presigned requires STORAGE_PROVIDER=s3',
      });
    }

    if (value.STORAGE_PROVIDER === 's3') {
      for (const key of [
        'AWS_REGION',
        'AWS_S3_BUCKET',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
      ] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when STORAGE_PROVIDER=s3`,
          });
        }
      }
    }
  });

const parsed = envSchema.safeParse(normalizedEnv);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  throw new Error(`Environment validation failed: ${issues}`);
}

export const env = parsed.data;
