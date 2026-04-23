import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './app/config/env';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { notFoundHandler } from './app/middlewares/notFoundHandler';
import { requestLogger } from './app/middlewares/requestLogger';
import { router } from './app/routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

app.use(env.API_PREFIX, router);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
