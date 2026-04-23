import { Response } from 'express';

import { ApiResponse } from '../interfaces/common';

export const sendResponse = <T>(
  res: Response,
  payload: {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T;
    meta?: Record<string, unknown>;
  },
): void => {
  const response: ApiResponse<T> = {
    success: payload.success,
    message: payload.message,
    data: payload.data,
    meta: payload.meta,
  };

  res.status(payload.statusCode).json(response);
};
