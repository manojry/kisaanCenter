import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  transaction_id: z.preprocess((val) => val === undefined || val === null || val === '' ? undefined : Number(val), z.number().int().positive()).optional(),
  payer_type: z.enum(['BUYER', 'SHOP']),
  payee_type: z.enum(['SHOP', 'FARMER']),
  amount: z.preprocess((val) => Number(val), z.number().positive()),
  method: z.enum(['CASH', 'BANK', 'UPI', 'OTHER']),
  notes: z.string().optional()
});

// Bulk payment schema
export const BulkPaymentItemSchema = z.object({
  transaction_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  amount: z.preprocess((val) => Number(val), z.number().positive()),
});

export const BulkPaymentSchema = z.object({
  payments: z.array(BulkPaymentItemSchema),
  payer_type: z.enum(['BUYER', 'SHOP']),
  payee_type: z.enum(['SHOP', 'FARMER']),
  method: z.enum(['CASH', 'BANK', 'UPI', 'OTHER']),
  status: z.enum(['PENDING', 'PAID', 'FAILED']).optional(),
  notes: z.string().optional(),
});

export const UpdatePaymentStatusSchema = z.object({
  status: z.enum(['PAID', 'FAILED']),
  payment_date: z.string().datetime().optional(),
  notes: z.string().optional()
});

export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentStatus = z.infer<typeof UpdatePaymentStatusSchema>;