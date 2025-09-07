import { z } from 'zod';

export const TransactionSchema = z.object({
  shop_id: z.number().int().positive(),
  farmer_id: z.string().min(1, 'Farmer ID is required'),
  buyer_id: z.string().min(1, 'Buyer ID is required'),
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  total: z.number().positive().optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  commission_amount: z.number().min(0).optional(),
  farmer_paid: z.number().min(0).optional(),
  buyer_paid: z.number().min(0).optional(),
  deficit: z.number().optional(),
  status: z.enum(['pending', 'paid', 'partial', 'credit', 'farmer_due']).optional(),
  transaction_date: z.string().optional(),
});