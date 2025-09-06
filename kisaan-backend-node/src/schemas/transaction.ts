import { z } from 'zod';

export const TransactionSchema = z.object({
  shop_id: z.number().int().positive(),
  buyer_id: z.string().min(1),
  seller_id: z.string().min(1),
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  total: z.number().positive(),
  transaction_date: z.string().datetime(),
});
