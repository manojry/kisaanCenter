import { z } from 'zod';

export const ShopCategoryBaseSchema = z.object({
  shop_id: z.number().int().positive(),
  category_id: z.number().int().positive(),
});

export const ShopCategoryCreateSchema = ShopCategoryBaseSchema;

export const ShopCategoryReadSchema = ShopCategoryBaseSchema.extend({
  id: z.number().int(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Schema for assigning multiple categories to a shop
export const AssignCategoriesToShopSchema = z.object({
  shop_id: z.number().int().positive(),
  category_ids: z.array(z.number().int().positive()).min(1),
});

// Schema for removing categories from a shop
export const RemoveCategoriesFromShopSchema = z.object({
  shop_id: z.number().int().positive(),
  category_ids: z.array(z.number().int().positive()).min(1),
});

export type ShopCategoryCreate = z.infer<typeof ShopCategoryCreateSchema>;
export type ShopCategoryRead = z.infer<typeof ShopCategoryReadSchema>;
export type AssignCategoriesToShop = z.infer<typeof AssignCategoriesToShopSchema>;
export type RemoveCategoriesFromShop = z.infer<typeof RemoveCategoriesFromShopSchema>;
