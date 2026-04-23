import { ErrorRequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { ApiError } from '../errors/ApiError';
import { handleCastError } from '../errors/handleCastError';
import { handleDuplicateError } from '../errors/handleDuplicateError';
import { handleValidationError } from '../errors/handleValidationError';
import { handleZodError } from '../errors/handleZodError';
import { logger } from '../logger';

export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
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

  logger.error('Global error handler caught an error', {
    statusCode,
    message,
    errorSources,
    stack: error instanceof Error ? error.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
  });
};
