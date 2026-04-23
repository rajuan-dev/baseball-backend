import { randomUUID } from 'node:crypto';

import { NextFunction, Request, RequestHandler, Response } from 'express';
import pinoHttp from 'pino-http';

import { pinoLogger } from '../logger';
import { getUploadedFilesMetadata, sanitizeForLogging } from '../observability/sanitize';
import { getRequestId, resolveRequestId } from '../observability/requestContext';

export const httpLogger = pinoHttp({
  logger: pinoLogger,
  genReqId: (req, res) => {
    return resolveRequestId(req as Request, res as Response);
  },
  customAttributeKeys: {
    reqId: 'requestId',
  },
  serializers: {
    req: (req) => ({
      requestId: (req as Request & { id?: string }).id ?? null,
      method: req.method,
      url: req.url,
      remoteAddress: req.socket.remoteAddress,
      remotePort: req.socket.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: (error) => ({
      type: error.name,
      message: error.message,
      stack: error.stack,
    }),
  },
  customSuccessMessage: () => 'request completed',
  customErrorMessage: (_req, _res, error) => error?.message ?? 'request failed',
}) as RequestHandler;

const getFallbackRequestLogger = (req: Request) => {
  return (
    (req as Request & { log?: typeof pinoLogger }).log ??
    pinoLogger.child({
      requestId: getRequestId(req) ?? randomUUID(),
    })
  );
};

export const requestPayloadLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    getFallbackRequestLogger(req).info(
      {
        event: 'http.request.payload',
        requestId: getRequestId(req),
        method: req.method,
        url: req.originalUrl,
        contentType: req.headers['content-type'] ?? null,
        query: sanitizeForLogging(req.query),
        params: sanitizeForLogging(req.params),
        body: sanitizeForLogging(req.body),
        files: getUploadedFilesMetadata(req),
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      },
      'HTTP request payload',
    );
  });

  next();
};
