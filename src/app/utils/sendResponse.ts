import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiResponse } from '../interfaces/common';

type ResponseMeta = Record<string, unknown> | null;

type ResponsePayload<T> = {
  statusCode?: number;
  message: string;
  data?: T;
  meta?: ResponseMeta;
};

const buildResponse = <T>(payload: {
  success: true;
  message: string;
  data?: T;
  meta?: ResponseMeta;
}): ApiResponse<T> => {
  const pagination =
    payload.meta && typeof payload.meta === 'object' && 'pagination' in payload.meta
      ? { pagination: payload.meta.pagination }
      : {};

  return {
    success: true,
    message: payload.message,
    data: payload.data ?? null,
    meta: payload.meta ?? null,
    ...pagination,
    timestamp: new Date().toISOString(),
  };
};

const send = <T>(res: Response, statusCode: number, payload: ResponsePayload<T>): void => {
  res.status(statusCode).json(
    buildResponse({
      success: true,
      message: payload.message,
      data: payload.data,
      meta: payload.meta,
    }),
  );
};

export const response = {
  success<T>(res: Response, payload: ResponsePayload<T>): void {
    send(res, payload.statusCode ?? StatusCodes.OK, payload);
  },
  created<T>(res: Response, payload: Omit<ResponsePayload<T>, 'statusCode'>): void {
    send(res, StatusCodes.CREATED, payload);
  },
  paginated<T>(
    res: Response,
    payload: {
      message: string;
      data: T;
      meta: Record<string, unknown>;
      statusCode?: number;
    },
  ): void {
    send(res, payload.statusCode ?? StatusCodes.OK, payload);
  },
  noContent(res: Response): void {
    res.status(StatusCodes.NO_CONTENT).send();
  },
};

export const sendResponse = <T>(
  res: Response,
  payload: {
    statusCode: number;
    success?: boolean;
    message: string;
    data?: T;
    meta?: Record<string, unknown> | null;
  },
): void => {
  send(res, payload.statusCode, payload);
};
