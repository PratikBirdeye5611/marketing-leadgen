import { Request, Response, NextFunction } from 'express';
import { InputValidationException } from '../exceptions/input-validation.exception';
import { LeadGenException } from '../exceptions/leadgen.exception';

export function errorHandlerMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof InputValidationException) {
    res.status(400).json({
      error: error.errorCode,
      message: error.message,
      params: error.params,
    });
    return;
  }

  if (error instanceof LeadGenException) {
    res.status(500).json({
      error: error.errorCode,
      message: error.message,
    });
    return;
  }

  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: isDev ? error.message : 'An unexpected error occurred',
    ...(isDev && { stack: error.stack }),
  });
}
