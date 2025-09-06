import { z } from 'zod';

export const ProductBaseSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  category_id: z.number().int().positive(),
  unit: z.string().max(20).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const ProductCreateSchema = ProductBaseSchema;

export const ProductUpdateSchema = ProductBaseSchema.partial().extend({
  category_id: z.number().int().positive().optional(),
});

export const ProductReadSchema = ProductBaseSchema.extend({
  id: z.number().int(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductRead = z.infer<typeof ProductReadSchema>;
