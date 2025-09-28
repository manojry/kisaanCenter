import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/logging/logger';
import { ValidationError, AuthorizationError, NotFoundError, BusinessRuleError, DatabaseError, AppError } from '../shared/utils/errors';
import { failure } from '../shared/http/respond';

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  reqId?: string;
  details?: any;
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const statusMap: Record<string, number> = {
    ValidationError: 400,
    AuthorizationError: 403,
    NotFoundError: 404,
    BusinessRuleError: 422
  };
  let status = statusMap[err?.name] || 500;
  if (err instanceof DatabaseError) status = 500;
  if (err instanceof AppError) status = err.statusCode;

  const baseMessage = err?.message || 'Internal Server Error';
  const errorName = err?.name || 'InternalError';

  // Legacy payload (from earlier middleware) passthrough if present
  const legacy = err?.legacyPayload;

  // Log
  if (status >= 500) {
    logger.error({ err, reqId: req.id }, 'Unhandled server error');
  } else {
    req.log?.warn({ err }, 'Application error');
  }

  // Build details object (include legacy + stack in dev)
  const details: any = {};
  if (legacy) details.legacy = legacy;
  if (err?.context) details.context = err.context;
  if (process.env.NODE_ENV === 'development' && err?.stack) details.stack = err.stack;

  return failure(res, status, errorName, Object.keys(details).length ? details : undefined, baseMessage);
}
