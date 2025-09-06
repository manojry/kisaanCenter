import { z } from 'zod';

export const BillingCycleEnum = z.enum(['monthly', 'quarterly', 'yearly']);

export const PlanBaseSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().nonnegative(),
  billing_cycle: BillingCycleEnum,
  max_users: z.number().int().positive().optional().nullable(),
  max_products: z.number().int().positive().optional().nullable(),
  max_transactions: z.number().int().positive().optional().nullable(),
  features: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export const PlanCreateSchema = PlanBaseSchema;

export const PlanUpdateSchema = PlanBaseSchema.partial();

export const PlanReadSchema = PlanBaseSchema.extend({
  id: z.number().int(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type BillingCycle = z.infer<typeof BillingCycleEnum>;
export type PlanCreate = z.infer<typeof PlanCreateSchema>;
export type PlanUpdate = z.infer<typeof PlanUpdateSchema>;
export type PlanRead = z.infer<typeof PlanReadSchema>;
