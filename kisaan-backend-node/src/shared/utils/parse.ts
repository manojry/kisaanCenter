import { ValidationFailure } from '../validation/validate';

/**
 * parseId
 * Centralized numeric identifier parsing with consistent error semantics.
 * Throws ValidationFailure (caught by global error middleware -> standardized failure envelope).
 */
export function parseId(raw: any, resource: string = 'resource'): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new ValidationFailure(`${resource} id must be a positive integer`, [
      { path: ['id'], message: 'Invalid id', code: 'invalid_integer', received: raw }
    ]);
  }
  return n;
}

  // parseOptionalId: returns a positive integer or undefined if input is null/empty. Validates when provided.
  export function parseOptionalId(value: any, label: string = 'id'): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return parseId(value, label);
  }
