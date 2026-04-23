import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export type ExpressRequest<
  TBody = Record<string, unknown>,
  TQuery = ParsedQs,
  TParams = ParamsDictionary,
> = Request<TParams, unknown, TBody, TQuery>;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}
