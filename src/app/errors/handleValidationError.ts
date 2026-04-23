import { Error as MongooseError } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { IGenericErrorResponse } from '../interfaces/error';

export const handleValidationError = (
  error: MongooseError.ValidationError,
): IGenericErrorResponse => {
  const errorSources = Object.values(error.errors).map((value) => ({
    path: value.path,
    message: value.message,
  }));

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'Validation failed',
    errorSources,
  };
};
