import { z } from 'zod';

// Core create credit advance payload
export const CreateCreditAdvanceSchema = z.object({
  user_id: z.preprocess((v) => Number(v), z.number().int().positive()),
  amount: z.preprocess((v) => Number(v), z.number().positive()),
  description: z.string().max(255).optional()
});

// Repayment of an existing credit advance
export const RepayCreditAdvanceSchema = z.object({
  credit_id: z.preprocess((v) => Number(v), z.number().int().positive()),
  amount: z.preprocess((v) => Number(v), z.number().positive()),
  notes: z.string().max(255).optional()
});

// Expanded record schema (e.g., when returning stored entries)
export const CreditAdvanceRecordSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  amount: z.number().positive(),
  issued_date: z.string(),
  due_date: z.string().optional(),
  status: z.enum(['open','repaid','partial']).default('open')
});

export const CreditRepaymentRecordSchema = z.object({
  id: z.number().int().positive(),
  credit_id: z.number().int().positive(),
  amount: z.number().positive(),
  created_at: z.string()
});

export type CreateCreditAdvanceInput = z.infer<typeof CreateCreditAdvanceSchema>;
export type RepayCreditAdvanceInput = z.infer<typeof RepayCreditAdvanceSchema>;
