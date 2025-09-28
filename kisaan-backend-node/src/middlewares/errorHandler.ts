// Global error handling middleware
import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/logging/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Prefer per-request logger if present
  (req as any).log?.error({ err }, 'unhandled error');
  logger.error({ err }, 'unhandled error');

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: err.message || 'Internal Server Error',
    details: err.details || undefined,
  });
}
