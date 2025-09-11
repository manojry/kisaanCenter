import { z } from 'zod';

export const CreateTransactionSchema = z.object({
  shop_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  farmer_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  buyer_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  category_id: z.preprocess((val) => Number(val), z.number().int().positive()),
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.preprocess((val) => Number(val), z.number().positive()),
  unit_price: z.preprocess((val) => Number(val), z.number().positive())
});

// Payment schemas moved to payment.ts to avoid duplicate exports