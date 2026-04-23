import { randomUUID } from 'node:crypto';

import { Request, Response } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';

const normalizeRequestId = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const resolveRequestId = (req: Request, res: Response): string => {
  const existing =
    normalizeRequestId(req.headers[REQUEST_ID_HEADER]) ??
    normalizeRequestId(req.headers['request-id']) ??
    normalizeRequestId(res.getHeader(REQUEST_ID_HEADER)) ??
    randomUUID();

  res.setHeader(REQUEST_ID_HEADER, existing);

  return existing;
};

export const getRequestId = (req: Request): string => {
  return (
    normalizeRequestId((req as Request & { id?: string }).id) ??
    normalizeRequestId(req.headers[REQUEST_ID_HEADER]) ??
    randomUUID()
  );
};
