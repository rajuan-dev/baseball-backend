import { NextFunction, Request, RequestHandler, Response } from 'express';

export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
};
