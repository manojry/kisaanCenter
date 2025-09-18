import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { 
  UserCreateSchema, 
  UserUpdateSchema, 
  UserPasswordResetSchema,
  UserSearchSchema
} from '../schemas/user';
import * as userService from '../services/userService';
import { UserDTO } from '../dtos/UserDTO';

export class UserController {
  async createUser(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
  ): Promise<void> {
  try {
    // Auto-generate username if not present in req.body
    let reqBody = { ...req.body };
    if (!reqBody.username) {
      let baseName = '';
      if (reqBody.firstname) {
        baseName = reqBody.firstname.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
      } else {
        baseName = 'user';
      }
      let shopIdPart = reqBody.shop_id ? reqBody.shop_id.toString() : '0';
      let uniqueNum = Math.floor(Math.random() * 10000) + 1;
      reqBody.username = `${baseName}_${shopIdPart}_${uniqueNum}`;
    }

    const parsed = UserCreateSchema.safeParse(reqBody);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    // Pass firstname explicitly if present
    const user: UserDTO = await userService.createUser(
      { ...parsed.data, firstname: reqBody.firstname },
      req.user?.id || 1,
      req.user?.role
    );
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (err: any) {
    console.error('CreateUser error:', err);
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

  async getUsers(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
  ): Promise<void> {
  try {
    const parsed = UserSearchSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.issues });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const includeBalance = req.query.include_balance === 'true';
  const result = await userService.getAllUsers(parsed.data, req.user, includeBalance);
  // Only return 'users' array, not both 'data' and 'users'
  const { users, total, page, limit } = result;
  res.json({ success: true, users, total, page, limit });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    next(err);
  }
};

  async getUserById(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
  ): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user: UserDTO | null = await userService.getUserById(id, req.user);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ 
      success: true,
      message: 'User retrieved successfully', 
      data: user 
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    next(err);
  }
};

  async updateUser(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
  ): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const parsed = UserUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user: UserDTO | null = await userService.updateUser(id, parsed.data, req.user);
    res.json({ 
      success: true,
      message: 'User updated successfully', 
      data: user 
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    next(err);
  }
};

  async resetPassword(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
  ): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const parsed = UserPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    await userService.resetPassword(id, parsed.data);
    res.json({ 
      success: true,
      message: 'Password reset successfully' 
    });
  } catch (err: any) {
    next(err);
  }
};

  async adminResetPassword(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
  ): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await userService.adminResetPassword(id, newPassword, req.user);
    res.json({ 
      success: true,
      message: 'Password reset successfully' 
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    next(err);
  }
};

  async deleteUser(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
  ): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await userService.deleteUser(id, req.user);
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    next(err);
  }
};

  async getCurrentUser(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
  ): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user: UserDTO | null = await userService.getUserById(req.user.id, req.user);
    res.json({ 
      success: true,
      message: 'Current user retrieved successfully', 
      data: user 
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
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
