import { Request, Response, NextFunction } from 'express';
import {
  UserCreateSchema,
  UserUpdateSchema,
  UserPasswordResetSchema,
  UserSearchSchema
} from '../schemas/user';
import * as userService from '../services/userService';
import { UserDTO } from '../dtos';

// Shared utilities & helpers
// import { USER_ROLES } from '../shared/constants';
// import { StringFormatter } from '../shared/utils/formatting';
// import { AuthenticationError } from '../shared/utils/errors';
import { validate, ValidationFailure } from '../shared/validation/validate';
import { success, created, failureCode, standardDelete } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';

// TODO: Replace inline parseInt/isNaN with shared parseId helper once introduced.
const parseId = (raw: string, resource: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id)) throw new ValidationFailure(`${resource} id must be an integer`, []);
  return id;
};

export class UserController {
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      req.log?.info({ actor: (req as any).user?.id }, 'createUser attempt');
      // Distinguish between missing username (auto-generate) and explicitly empty string (validation error)
  const reqBody = { ...req.body };
      if (reqBody.username === '') {
        // Explicit empty provided -> surface validation error with consistent code path
        failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'username' }, 'username cannot be empty');
        return;
      }
      // Auto-generate username only when undefined / null
      if (reqBody.username == null) {
        // Generate username using firstname + owner_id combination
        let baseName = 'user';
        if (reqBody.firstname && reqBody.firstname.trim()) {
          // Use firstname, remove spaces and convert to lowercase
          baseName = reqBody.firstname.trim().toLowerCase().replace(/\s+/g, '');
        }
        
        // Get owner ID from the current user or the shop owner
        let ownerIdPart = '0';
        if ((req as any).user?.role === 'owner') {
          ownerIdPart = String((req as any).user.id);
        } else if (reqBody.shop_id) {
          // For users created under a shop, use shop_id as owner reference
          ownerIdPart = String(reqBody.shop_id);
        }
        
        const uniqueNum = Math.floor(Math.random() * 1000) + 1;
        reqBody.username = `${baseName}_${ownerIdPart}_${uniqueNum}`;
      }

      const data = validate(UserCreateSchema, reqBody);
      const user: UserDTO = await userService.createUser(
        { ...data },
        (req as any).user?.id || 1,
        (req as any).user?.role
      );
      created(res, user, { message: 'User created successfully' });
    } catch (err: unknown) {
      req.log?.error({ err }, 'createUser failed');
      next(err);
    }
  }

  async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = validate(UserSearchSchema, req.query);
      if (!(req as any).user) {
        failureCode(res, 401, ErrorCodes.AUTH_REQUIRED);
        return;
      }
  // include_balance is no longer accepted by service; keep parsing for backward compatibility but don't pass it
  const _includeBalance = req.query.include_balance === 'true';
  const result = await userService.getAllUsers(query, (req as any).user);
      const { users, total, page, limit } = result;
      success(res, users, {
        message: 'Users retrieved successfully',
        meta: { total, page, limit }
      });
    } catch (err) {
      req.log?.error({ err }, 'getUsers failed');
      next(err);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseId(req.params.id, 'user');
      if (!(req as any).user) {
        failureCode(res, 401, ErrorCodes.AUTH_REQUIRED);
        return;
      }
      const user: UserDTO | null = await userService.getUserById(id, (req as any).user);
      if (!user) {
        failureCode(res, 404, ErrorCodes.USER_NOT_FOUND);
        return;
      }
      success(res, user, { message: 'User retrieved successfully' });
    } catch (err) {
      req.log?.error({ err }, 'getUserById failed');
      next(err);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseId(req.params.id, 'user');
      // Remove password if it's an empty string so validation doesn't fail
  const reqBody = { ...req.body };
      if (typeof reqBody.password === 'string' && reqBody.password.trim() === '') {
        delete reqBody.password;
      }
      const data = validate(UserUpdateSchema, reqBody);
      if (!(req as any).user) {
        failureCode(res, 401, ErrorCodes.AUTH_REQUIRED);
        return;
      }
      const user: UserDTO | null = await userService.updateUser(id, data, (req as any).user);
      success(res, user, { message: 'User updated successfully' });
    } catch (err) {
      req.log?.error({ err }, 'updateUser failed');
      next(err);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseId(req.params.id, 'user');
      const data = validate(UserPasswordResetSchema, req.body);
      await userService.resetPassword(id, data);
      success(res, { }, { message: 'Password reset successfully' });
    } catch (err) {
      req.log?.error({ err }, 'resetPassword failed');
      next(err);
    }
  }

  async adminResetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseId(req.params.id, 'user');
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, undefined, 'New password must be at least 6 characters');
        return;
      }
      if (!(req as any).user) {
        failureCode(res, 401, ErrorCodes.AUTH_REQUIRED);
        return;
      }
      await userService.adminResetPassword(id, newPassword, (req as any).user);
      success(res, { }, { message: 'Password reset successfully' });
    } catch (err) {
      req.log?.error({ err }, 'adminResetPassword failed');
      next(err);
    }
  }

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseId(req.params.id, 'user');
      if (!(req as any).user) {
        failureCode(res, 401, ErrorCodes.AUTH_REQUIRED);
        return;
      }
      await userService.deleteUser(id, (req as any).user);
      standardDelete(res, id, 'user');
      return;
    } catch (err) {
      req.log?.error({ err }, 'deleteUser failed');
      next(err);
    }
  }

  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!(req as any).user) {
        failureCode(res, 401, ErrorCodes.AUTH_REQUIRED);
        return;
      }
      const user: UserDTO | null = await userService.getUserById((req as any).user.id, (req as any).user);
      success(res, user, { message: 'Current user retrieved successfully' });
    } catch (err) {
      req.log?.error({ err }, 'getCurrentUser failed');
      next(err);
    }
  }
}
const userController = new UserController();
export { userController };
export const getCurrentUser = userController.getCurrentUser.bind(userController);
export const createUser = userController.createUser.bind(userController);
export const getUsers = userController.getUsers.bind(userController);
export const getUserById = userController.getUserById.bind(userController);
export const updateUser = userController.updateUser.bind(userController);
export const deleteUser = userController.deleteUser.bind(userController);
export const resetPassword = userController.resetPassword.bind(userController);
export const adminResetPassword = userController.adminResetPassword.bind(userController);
