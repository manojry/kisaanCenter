import { z } from 'zod';

export const UserRoleEnum = z.enum(['superadmin', 'owner', 'farmer', 'buyer']);
export const UserStatusEnum = z.enum(['active', 'inactive']);

export const UserBaseSchema = z.object({
  username: z.string().min(3),
  role: UserRoleEnum,
  shop_id: z.number().int().optional().nullable(),
  contact: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  status: UserStatusEnum.optional(),
});

export const UserCreateSchema = UserBaseSchema.extend({
  password: z.string().min(6),
  created_by: z.number().int().optional().nullable(),
});

export const UserUpdateSchema = UserBaseSchema.partial().extend({
  password: z.string().min(6).optional(),
  updated_at: z.date().optional(),
});

export const UserReadSchema = UserBaseSchema.extend({
  id: z.number().int(),
  created_by: z.number().int().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type UserRole = z.infer<typeof UserRoleEnum>;
export type UserStatus = z.infer<typeof UserStatusEnum>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserRead = z.infer<typeof UserReadSchema>;
