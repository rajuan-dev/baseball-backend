# Cloudways Deployment Notes

## Runtime Target

The backend can run locally or on Cloudways without code changes. Use environment
variables to point the API, uploaded files, CORS origins, database, and admin
bootstrap account at the current environment.

- Default storage: Cloudways/local server disk
- Upload directory: `UPLOAD_DIR`
- Public media URL: `PUBLIC_UPLOAD_URL`
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

UPLOAD_DRIVER=local
UPLOAD_MODE=server
UPLOAD_DIR=storage/uploads
LOCAL_UPLOADS_BASE_PATH=/uploads
PUBLIC_UPLOAD_URL=https://api.example.com/uploads
MAX_UPLOAD_FILE_SIZE_MB=5
ALLOWED_UPLOAD_MIME_TYPES=image/*,video/*

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
- `LOCAL_FILE_BASE_URL` maps to `PUBLIC_UPLOAD_URL`
- `LOCAL_UPLOADS_DIR` maps to `UPLOAD_DIR`
- `STORAGE_PROVIDER` maps to `UPLOAD_DRIVER`
- `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` map to `ADMIN_EMAIL` and `ADMIN_PASSWORD`

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

- Ensure `UPLOAD_DIR` is writable by the Cloudways app process.
- Keep `UPLOAD_DIR` persistent across deployments.
- Files are served by Express from `LOCAL_UPLOADS_BASE_PATH`.
- Set `PUBLIC_UPLOAD_URL` to the public HTTPS URL clients should use for media.

## Optional S3 Mode

```env
UPLOAD_DRIVER=s3
UPLOAD_MODE=server
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_PUBLIC_BASE_URL=https://your-bucket.s3.ap-south-1.amazonaws.com
```

For browser-direct uploads:

```env
UPLOAD_DRIVER=s3
UPLOAD_MODE=presigned
```
