import { z } from 'zod';

export const CreateTransactionSchema = z.object({
  shop_id: z.number().int().positive(),
  farmer_id: z.number().int().positive(),
  buyer_id: z.number().int().positive(),
  category_id: z.number().int().positive(),
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().positive(),
  unit_price: z.number().positive()
});

export const CreatePaymentSchema = z.object({
  transaction_id: z.number().int().positive(),
  payer_type: z.enum(['BUYER', 'SHOP']),
  payee_type: z.enum(['SHOP', 'FARMER']),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'BANK', 'UPI', 'OTHER']),
  notes: z.string().optional()
});

export const UpdatePaymentStatusSchema = z.object({
  status: z.enum(['PAID', 'FAILED']),
  payment_date: z.string().datetime().optional(),
  notes: z.string().optional()
});