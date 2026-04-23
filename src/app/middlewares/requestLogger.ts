import { NextFunction, Request, Response } from 'express';

import { logger } from '../logger';

const sanitizeBody = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const cloned = { ...(body as Record<string, unknown>) };

  for (const key of ['password', 'confirmPassword', 'token', 'otp']) {
    if (key in cloned) {
      cloned[key] = '[REDACTED]';
    }
  }

  return cloned;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info('HTTP request completed', {
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      params: req.params,
      query: req.query,
      body: sanitizeBody(req.body),
      durationMs: Date.now() - startedAt,
    });
  });

  next();
};
