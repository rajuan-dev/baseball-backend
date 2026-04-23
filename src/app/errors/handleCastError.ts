import { Error as MongooseError } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { IGenericErrorResponse } from '../interfaces/error';

export const handleCastError = (error: MongooseError.CastError): IGenericErrorResponse => {
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'Invalid resource identifier',
    errorSources: [
      {
        path: error.path,
        message: error.message,
      },
    ],
  };
};
