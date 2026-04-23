import { ErrorRequestHandler, Request } from 'express';
import { Error as MongooseError } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { ApiError } from '../errors/ApiError';
import { handleCastError } from '../errors/handleCastError';
import { handleDuplicateError } from '../errors/handleDuplicateError';
import { handleValidationError } from '../errors/handleValidationError';
import { handleZodError } from '../errors/handleZodError';
import { pinoLogger } from '../logger';
import { getRequestId } from '../observability/requestContext';
import { sanitizeForLogging } from '../observability/sanitize';

const getRequestLogger = (req: Request) => {
  return (
    (req as Request & { log?: typeof pinoLogger }).log ??
    pinoLogger.child({
      requestId: getRequestId(req),
    })
  );
};

export const globalErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';
  let errorSources: { path: string | number; message: string }[] = [];

  if (error instanceof ZodError) {
    const simplified = handleZodError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources ?? [];
  } else if (error instanceof MongooseError.ValidationError) {
    const simplified = handleValidationError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources ?? [];
  } else if (error instanceof MongooseError.CastError) {
    const simplified = handleCastError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources ?? [];
  } else if ((error as { code?: number }).code === 11000) {
    const simplified = handleDuplicateError(error as { keyValue?: Record<string, unknown> });
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources ?? [];
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorSources = error.errorSources ?? [];
  } else if (error instanceof Error) {
    message = error.message;
  }

  const requestId = getRequestId(req);

  getRequestLogger(req).error(
    {
      event: 'http.request.error',
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? null,
      params: sanitizeForLogging(req.params),
      query: sanitizeForLogging(req.query),
      body: sanitizeForLogging(req.body),
      statusCode,
      errorSources,
      err:
        error instanceof Error
          ? {
              type: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    },
    'Request failed',
  );

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    requestId,
    timestamp: new Date().toISOString(),
    stack: env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
  });
};
