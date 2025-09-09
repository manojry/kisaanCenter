import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorList = (error as any).errors;
        if (!Array.isArray(errorList) || errorList.length === 0) {
          console.error('Zod validation error (raw):', error);
        }
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Array.isArray(errorList)
            ? errorList.map((err: any) => ({
                field: err.path.join('.'),
                message: err.message
              }))
            : []
        });
      }
      next(error);
    }
  };
};