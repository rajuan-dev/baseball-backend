import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

import { IGenericErrorResponse } from '../interfaces/error';

export const handleZodError = (error: ZodError): IGenericErrorResponse => {
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'Request validation failed',
    errorSources: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
};
