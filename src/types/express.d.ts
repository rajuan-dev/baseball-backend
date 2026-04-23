import 'express-serve-static-core';
import pino from 'pino';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
    log?: pino.Logger;
  }
}
