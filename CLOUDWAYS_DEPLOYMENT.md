# Cloudways Deployment Notes

## Runtime Target

The backend can run locally or on Cloudways without code changes. Use environment
variables to point the API, uploaded files, CORS origins, database, and admin
bootstrap account at the current environment.

- Default storage: S3
- Public media URL: `AWS_S3_PUBLIC_BASE_URL` or the bucket public URL
- API URL exposed to clients: `API_BASE_URL`

## Backend Environment

Use `.env.example` as the base. Recommended Cloudways values:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=5000
API_PREFIX=/api/v1

MONGODB_URI=your-mongodb-connection-string

BASE_URL=https://api.example.com
API_BASE_URL=https://api.example.com/api/v1

STORAGE_PROVIDER=s3
UPLOAD_DRIVER=s3
UPLOAD_MODE=s3
MAX_UPLOAD_FILE_SIZE_MB=5
ALLOWED_UPLOAD_MIME_TYPES=image/*,video/*

AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_PUBLIC_BASE_URL=https://your-cdn-or-bucket-url.example.com

CORS_ORIGINS=https://admin.example.com

DEFAULT_ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=no-reply@example.com
```

Legacy variable names still work for compatibility:

- `APP_BASE_URL` maps to `BASE_URL`
- `STORAGE_PROVIDER` maps to `UPLOAD_DRIVER`
- `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` map to `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- `UPLOAD_MODE=s3` is accepted as server-side S3 upload mode for deployment convenience

## Dashboard Environment

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_BACKEND_BASE_URL=https://api.example.com
VITE_UPLOADS_BASE_URL=https://api.example.com/uploads
```

## Mobile App Environment

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com/api/v1
```

For local device testing, use a device-reachable URL in `.env`, such as a LAN IP
or Android emulator alias. Optional dev fallbacks can be configured without code
changes:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_API_BASE_URL_CANDIDATES=http://127.0.0.1:5000/api/v1,http://10.0.2.2:5000/api/v1,http://YOUR_LAN_IPV4:5000/api/v1
```

## Build And Start

```bash
npm install
npm run build
npm start
```

Run `npm run seed` if you need to seed or update the default admin account.

## Static Uploads

- Production should use S3 so uploaded files survive restarts and redeployments on
  stateless hosts such as Render, Railway, and Cloudways.
- Ensure the bucket policy or CDN allows public reads for uploaded media objects,
  or set `AWS_S3_PUBLIC_BASE_URL` to a CDN/domain that can serve them.
- Server-side uploads use the existing `/uploads/file` endpoint and return the
  same response shape with an S3-backed `fileUrl`.

## Disabled Local Uploads

Local disk uploads are disabled in the backend code. Do not configure
`STORAGE_PROVIDER=local` or `UPLOAD_DRIVER=local`; startup validation will reject
that configuration.

For browser-direct uploads:

```env
STORAGE_PROVIDER=s3
UPLOAD_DRIVER=s3
UPLOAD_MODE=presigned
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_PUBLIC_BASE_URL=https://your-cdn-or-bucket-url.example.com
```
