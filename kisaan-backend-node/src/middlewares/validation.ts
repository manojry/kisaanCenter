import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorCodes } from '../shared/errors/errorCodes';

export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorList = (error as any).errors;
        if (!Array.isArray(errorList) || errorList.length === 0) {
          (req as any).log?.warn({ err: error }, 'zod validation error (raw)');
        }
        return res.status(400).json({
          success: false,
          error: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation error',
          details: Array.isArray(errorList)
            ? errorList.map((err: any) => ({
                field: err.path.join('.') || 'root',
                code: err.code || 'invalid',
                message: err.message
              }))
            : []
        });
      }
      next(error);
    }
  };
};