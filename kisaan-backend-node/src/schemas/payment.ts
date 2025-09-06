import { z } from 'zod';

export const PaymentSchema = z.object({
  transaction_id: z.number().int().positive(),
  amount: z.number().positive(),
  payment_type: z.enum(['full', 'partial', 'credit']),
  payment_date: z.string().datetime(),
  payer_id: z.string().min(1),
  payee_id: z.string().min(1),
});
