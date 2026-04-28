import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { RequestHandler } from 'express';
import path from 'node:path';

import { env } from './app/config/env';
import { localUploadsRoot } from './app/config/paths';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { notFoundHandler } from './app/middlewares/notFoundHandler';
import { httpLogger, requestPayloadLogger } from './app/middlewares/requestLogger';
import { adminAliasRoutes, appAliasRoutes } from './app/routes/alias.routes';
import { router } from './app/routes';

const app = express();

app.use(express.json({ limit: '10mb' }) as RequestHandler);
app.use(httpLogger as RequestHandler);
app.use(express.urlencoded({ extended: true, limit: '10mb' }) as RequestHandler);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }) as RequestHandler,
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.CORS_ORIGINS.includes('*') || env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS_ORIGINS`));
    },
    credentials: true,
  }),
);
app.use(
  env.LOCAL_UPLOADS_BASE_PATH,
  express.static(path.resolve(localUploadsRoot), {
    etag: true,
    immutable: true,
    maxAge: '30d',
  }) as RequestHandler,
);
app.use(requestPayloadLogger as RequestHandler);

app.use(env.API_PREFIX, router);
app.use('/api/admin', adminAliasRoutes);
app.use('/api/app', appAliasRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
