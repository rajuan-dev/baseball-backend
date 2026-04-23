import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const uploadDriverSchema = z.enum(['local', 's3']).default('local');
const uploadModeSchema = z.enum(['server', 'presigned']).default('server');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    API_PREFIX: z.string().default('/api/v1'),
    APP_BASE_URL: z.string().url('APP_BASE_URL must be a valid URL').optional(),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    LOG_LEVEL: z.string().default('info'),
    DEFAULT_ADMIN_NAME: z.string().min(1, 'DEFAULT_ADMIN_NAME is required'),
    DEFAULT_ADMIN_EMAIL: z.email('DEFAULT_ADMIN_EMAIL must be a valid email'),
    DEFAULT_ADMIN_PASSWORD: z.string().min(8, 'DEFAULT_ADMIN_PASSWORD must be at least 8 characters'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    OTP_EXPIRES_MINUTES: z.coerce.number().int().positive().default(10),
    STORAGE_PROVIDER: uploadDriverSchema,
    UPLOAD_MODE: uploadModeSchema,
    LOCAL_UPLOADS_DIR: z.string().default('storage/uploads'),
    LOCAL_UPLOADS_BASE_PATH: z.string().default('/uploads'),
    LOCAL_FILE_BASE_URL: z.string().url('LOCAL_FILE_BASE_URL must be a valid URL').optional(),
    MAX_UPLOAD_FILE_SIZE_MB: z.coerce.number().int().positive().default(5),
    AWS_REGION: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_PUBLIC_BASE_URL: z.string().url('AWS_S3_PUBLIC_BASE_URL must be a valid URL').optional(),
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
    RESEND_FROM_EMAIL: z.email('RESEND_FROM_EMAIL must be a valid email'),
  })
  .superRefine((value, ctx) => {
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

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  throw new Error(`Environment validation failed: ${issues}`);
}

export const env = parsed.data;
