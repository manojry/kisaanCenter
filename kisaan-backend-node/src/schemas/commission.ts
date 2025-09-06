import { z } from 'zod';

export const CalculateCommissionSchema = z.object({
  transaction_id: z.number().int().positive(),
});
