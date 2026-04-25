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
app.use(helmet() as RequestHandler);
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(
  env.LOCAL_UPLOADS_BASE_PATH,
  express.static(path.resolve(localUploadsRoot)) as RequestHandler,
);
app.use(requestPayloadLogger as RequestHandler);

app.use(env.API_PREFIX, router);
app.use('/api/admin', adminAliasRoutes);
app.use('/api/app', appAliasRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
