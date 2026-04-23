import { env } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const colors: Record<LogLevel, string> = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};

const resetColor = '\x1b[0m';

const stringifyMeta = (meta?: LogMeta): string => {
  if (!meta || Object.keys(meta).length === 0) {
    return '';
  }

  const normalized = JSON.stringify(meta, (_key, value) => {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
      };
    }

    return value;
  });

  return ` ${normalized}`;
};

class AppLogger {
  private readonly currentLevel: LogLevel;

  constructor(level: string) {
    this.currentLevel = (levelPriority[level as LogLevel] ? level : 'info') as LogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return levelPriority[level] >= levelPriority[this.currentLevel];
  }

  private write(level: LogLevel, message: string, meta?: LogMeta): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formatted = `${colors[level]}[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}${stringifyMeta(meta)}${resetColor}`;

    if (level === 'error') {
      console.error(formatted);
      return;
    }

    console.log(formatted);
  }

  debug(message: string, meta?: LogMeta): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: LogMeta): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: LogMeta): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: LogMeta): void {
    this.write('error', message, meta);
  }
}

export const logger = new AppLogger(env.LOG_LEVEL);
