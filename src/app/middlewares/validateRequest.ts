import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });

    next();
  };
};
