import { z } from 'zod';

export const UserRoleEnum = z.enum(['superadmin', 'owner', 'farmer', 'buyer']);
export const UserStatusEnum = z.enum(['active', 'inactive']);

export const UserBaseSchema = z.object({
  username: z.string().min(3).max(50),
  role: UserRoleEnum,
  shop_id: z.number().int().optional().nullable(),
  contact: z.string().min(10).max(15).optional().nullable(),
  email: z.string().email().max(100).optional().nullable(),
  status: UserStatusEnum.default('active'),
  owner_id: z.string().max(20).optional().nullable(),
});

export const UserCreateSchema = UserBaseSchema.extend({
  password: z.string().min(6).max(100),
  created_by: z.number().int().optional().nullable(),
  firstname: z.string().min(2).max(50).optional(), // For auto-generating usernames
});

export const UserUpdateSchema = UserBaseSchema.partial().omit({ role: true }).extend({
  password: z.string().min(6).max(100).optional(),
}); // Can't change role after creation

export const UserPasswordResetSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(6).max(100),
  confirm_password: z.string().min(6).max(100),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export const UserSearchSchema = z.object({
  role: UserRoleEnum.optional(),
  status: UserStatusEnum.optional(),
  owner_id: z.string().optional(),
  shop_id: z.number().int().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const UserReadSchema = UserBaseSchema.extend({
  id: z.number().int(),
  created_by: z.number().int().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Type exports
export type UserRole = z.infer<typeof UserRoleEnum>;
export type UserStatus = z.infer<typeof UserStatusEnum>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserPasswordReset = z.infer<typeof UserPasswordResetSchema>;
export type UserSearch = z.infer<typeof UserSearchSchema>;
export type UserRead = z.infer<typeof UserReadSchema>;
