import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { RequestHandler } from 'express';

import { env } from './app/config/env';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { notFoundHandler } from './app/middlewares/notFoundHandler';
import { httpLogger, requestPayloadLogger } from './app/middlewares/requestLogger';
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
app.use(requestPayloadLogger as RequestHandler);

app.use(env.API_PREFIX, router);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
