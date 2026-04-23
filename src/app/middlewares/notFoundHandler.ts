import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../errors/ApiError';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(StatusCodes.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};
