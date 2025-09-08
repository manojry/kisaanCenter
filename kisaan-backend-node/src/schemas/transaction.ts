import { z } from 'zod';

export const TransactionSchema = z.object({
  shop_id: z.number().int().positive(),
  farmer_id: z.string().min(1, 'Farmer ID is required'),
  buyer_id: z.string().min(1, 'Buyer ID is required'),
  product_id: z.number().int().positive(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  total: z.number().positive().optional(),
  type: z.enum(['sale', 'purchase', 'credit', 'return']).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  commission_amount: z.number().min(0).optional(),
  farmer_paid: z.number().min(0).optional(),
  buyer_paid: z.number().min(0).optional(),
  deficit: z.number().optional(),
  status: z.enum(['pending', 'completed', 'cancelled', 'partial', 'credit', 'farmer_due']).optional(),
  payment_method: z.enum(['cash', 'credit', 'bank_transfer', 'upi']).optional(),
  notes: z.string().optional(),
  transaction_date: z.string().optional(),
});

export const TransactionUpdateSchema = z.object({
  quantity: z.number().positive().optional(),
  price: z.number().positive().optional(),
  status: z.enum(['pending', 'completed', 'cancelled', 'partial', 'credit', 'farmer_due']).optional(),
  farmer_paid: z.number().min(0).optional(),
  buyer_paid: z.number().min(0).optional(),
  payment_method: z.enum(['cash', 'credit', 'bank_transfer', 'upi']).optional(),
  notes: z.string().optional(),
});

export const BulkTransactionSchema = z.object({
  transactions: z.array(TransactionSchema).min(1, 'At least one transaction is required')
});