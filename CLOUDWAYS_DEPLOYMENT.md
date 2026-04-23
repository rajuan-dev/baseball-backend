# Cloudways Deployment Notes

## Primary Runtime Target

This backend is configured to run on Cloudways as the primary deployment target.

- Default storage provider: `local`
- Default upload mode: `server`
- Uploaded files are stored on the application server and served from `LOCAL_UPLOADS_BASE_PATH`
- AWS S3 support remains available through `STORAGE_PROVIDER=s3`

## Required Environment Variables

Use `.env.example` as the base.

Recommended Cloudways values:

```env
NODE_ENV=production
PORT=5000
APP_BASE_URL=https://your-backend-domain.com
API_PREFIX=/api/v1
MONGODB_URI=your-mongodb-connection-string
LOG_LEVEL=info

DEFAULT_ADMIN_NAME=System Admin
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
OTP_EXPIRES_MINUTES=10

STORAGE_PROVIDER=local
UPLOAD_MODE=server
LOCAL_UPLOADS_DIR=storage/uploads
LOCAL_UPLOADS_BASE_PATH=/uploads
LOCAL_FILE_BASE_URL=https://your-backend-domain.com/uploads
MAX_UPLOAD_FILE_SIZE_MB=5

RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=no-reply@example.com
```

## Build And Start

```bash
npm install
npm run build
npm start
```

For process supervision on Cloudways, run the compiled app continuously with the platform's Node.js application process management.

## Static Uploads

- Ensure the directory configured by `LOCAL_UPLOADS_DIR` is writable by the app process
- Keep that directory persistent across deployments
- Files are served by Express from `LOCAL_UPLOADS_BASE_PATH`

## Optional AWS Mode

To switch back to S3:

```env
STORAGE_PROVIDER=s3
UPLOAD_MODE=server
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_PUBLIC_BASE_URL=https://your-bucket.s3.ap-south-1.amazonaws.com
```

If you later want browser-direct uploads again:

```env
STORAGE_PROVIDER=s3
UPLOAD_MODE=presigned
```

The backend still exposes `/api/v1/uploads/presign` for that optional flow.
