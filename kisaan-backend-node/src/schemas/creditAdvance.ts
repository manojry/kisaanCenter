import { z } from 'zod';

export const CreditAdvanceSchema = z.object({
  user_id: z.string().min(1),
  amount: z.number().positive(),
  issued_date: z.string().datetime(),
  due_date: z.string().datetime(),
});

export const RepayCreditSchema = z.object({
  credit_id: z.number().int().positive(),
  amount: z.number().positive(),
});
