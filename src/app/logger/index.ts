import pino from 'pino';

import { env } from '../config/env';

const loggerOptions: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      'authorization',
      'headers.authorization',
      'req.headers.authorization',
      'body.password',
      'body.currentPassword',
      'body.newPassword',
      'body.confirmPassword',
      'body.token',
      'body.accessToken',
      'body.refreshToken',
    ],
    censor: '[REDACTED]',
  },
};

const transport =
  env.NODE_ENV === 'development'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
          singleLine: true,
        },
      })
    : undefined;

export const pinoLogger = pino(loggerOptions, transport);

type LogMeta = Record<string, unknown>;

const logWithMeta = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  meta?: LogMeta,
): void => {
  if (meta) {
    pinoLogger[level](meta, message);
    return;
  }

  pinoLogger[level](message);
};

export const logger = {
  debug(message: string, meta?: LogMeta): void {
    logWithMeta('debug', message, meta);
  },
  info(message: string, meta?: LogMeta): void {
    logWithMeta('info', message, meta);
  },
  warn(message: string, meta?: LogMeta): void {
    logWithMeta('warn', message, meta);
  },
  error(message: string, meta?: LogMeta): void {
    logWithMeta('error', message, meta);
  },
};
