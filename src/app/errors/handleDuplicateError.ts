import { StatusCodes } from 'http-status-codes';

import { IGenericErrorResponse } from '../interfaces/error';

export const handleDuplicateError = (error: {
  keyValue?: Record<string, unknown>;
}): IGenericErrorResponse => {
  const field = Object.keys(error.keyValue ?? {})[0] ?? 'field';

  return {
    statusCode: StatusCodes.CONFLICT,
    message: 'Duplicate value found',
    errorSources: [
      {
        path: field,
        message: `${field} already exists`,
      },
    ],
  };
};
