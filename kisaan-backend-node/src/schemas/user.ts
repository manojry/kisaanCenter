import { z } from 'zod';

export const UserRoleEnum = z.enum(['superadmin', 'owner', 'farmer', 'buyer']);

// Password reset schema
export const PasswordResetSchema = z.object({
  newPassword: z.string().min(6).max(100),
});
export const UserStatusEnum = z.enum(['active', 'inactive']);

export const UserBaseSchema = z.object({
  username: z.string().min(3).max(50),
  role: UserRoleEnum,
  shop_id: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().optional().nullable()
  ),
  contact: z.string().min(10).max(15).optional().nullable(),
  email: z.string().email().max(100).optional().nullable(),
  firstname: z.string().min(2).max(50).optional(),
  status: UserStatusEnum.default('active'),
  owner_id: z.string().max(20).optional().nullable(),
  balance: z.number().optional(),
});

export const UserCreateSchema = UserBaseSchema.extend({
  password: z.string().min(6).max(100),
  created_by: z.number().int().optional().nullable(),
  firstname: z.string().min(2).max(50).optional(), // For auto-generating usernames
}).superRefine((data, ctx) => {
  // Superadmin can create: superadmin, owner
  // Owner can create: farmer, buyer (with shop_id)
  if ((data.role === 'farmer' || data.role === 'buyer') && (!data.shop_id || isNaN(Number(data.shop_id)))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'shop_id is required for farmer and buyer users',
      path: ['shop_id'],
    });
  }
});

export const UserUpdateSchema = UserBaseSchema.partial().omit({ role: true }).extend({
  password: z.string().min(6).max(100).optional(),
  firstname: z.string().min(2).max(50).optional(),
}); // Can't change role after creation

export const UserPasswordResetSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).max(100),
}).transform(data => ({
  current_password: data.currentPassword,
  new_password: data.newPassword
}));

export const UserSearchSchema = z.object({
  role: UserRoleEnum.optional(),
  status: UserStatusEnum.optional(),
  owner_id: z.string().optional(),
  shop_id: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().optional()
  ),
  page: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 1 : Number(val)),
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 20 : Number(val)),
    z.number().int().min(1).max(100).default(20)
  ),
});

export const UserReadSchema = UserBaseSchema.extend({
  id: z.number().int(),
  created_by: z.number().int().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  firstname: z.string().min(2).max(50).optional(),
});

// Type exports
export type UserRole = z.infer<typeof UserRoleEnum>;
export type UserStatus = z.infer<typeof UserStatusEnum>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserPasswordReset = z.infer<typeof UserPasswordResetSchema>;
export type UserSearch = z.infer<typeof UserSearchSchema>;
export type UserRead = z.infer<typeof UserReadSchema>;
