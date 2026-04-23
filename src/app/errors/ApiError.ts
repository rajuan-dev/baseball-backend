export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorSources?: { path: string | number; message: string }[];

  constructor(
    statusCode: number,
    message: string,
    errorSources?: { path: string | number; message: string }[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorSources = errorSources;

    Error.captureStackTrace(this, this.constructor);
  }
}
