import { ZodSchema, ZodError } from 'zod';

export class ValidationFailure extends Error {
  issues: any;
  constructor(message: string, issues: any) {
    super(message);
    this.name = 'ValidationFailure';
    this.issues = issues;
  }
}

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationFailure('Validation failed', err.issues);
    }
    throw err;
  }
}
