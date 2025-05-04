import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error: ${message}`, {
    method: req.method,
    path: req.path,
    statusCode,
    error: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler; 