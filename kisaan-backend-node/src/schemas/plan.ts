import { z } from 'zod';
import Joi from 'joi';

export const PlanBaseSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  monthly_price: z.number().nonnegative().optional().nullable(),
  quarterly_price: z.number().nonnegative().optional().nullable(),
  yearly_price: z.number().nonnegative().optional().nullable(),
  max_farmers: z.number().int().positive().optional().nullable(),
  max_buyers: z.number().int().positive().optional().nullable(),
  max_transactions: z.number().int().positive().optional().nullable(),
  data_retention_months: z.number().int().positive().optional().nullable(),
  features: z.array(z.string()).default([]),
  status: z.string().default('active'),
});

export const PlanCreateSchema = PlanBaseSchema;

export const PlanUpdateSchema = PlanBaseSchema.partial();

export const PlanReadSchema = PlanBaseSchema.extend({
  id: z.number().int(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const createPlanSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().optional().max(500),
  price: Joi.number().required().min(0),
  duration_months: Joi.number().required().min(1).max(12),
  features: Joi.array().items(Joi.string()).optional(),
  is_active: Joi.boolean().optional().default(true)
});

export const updatePlanSchema = Joi.object({
  name: Joi.string().optional().min(3).max(100),
  description: Joi.string().optional().max(500),
  price: Joi.number().optional().min(0),
  duration_months: Joi.number().optional().min(1).max(12),
  features: Joi.array().items(Joi.string()).optional(),
  is_active: Joi.boolean().optional()
});

export const planIdSchema = Joi.object({
  id: Joi.number().required().positive()
});

export type PlanCreate = z.infer<typeof PlanCreateSchema>;
export type PlanUpdate = z.infer<typeof PlanUpdateSchema>;
export type PlanRead = z.infer<typeof PlanReadSchema>;
