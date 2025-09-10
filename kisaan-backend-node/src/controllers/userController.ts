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

export const createUser = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = UserCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    const user: UserDTO = await userService.createUser(parsed.data, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (err: any) {
    // Enhanced error logging for debugging
    console.error('CreateUser error:', err);
    if (err && err.stack) {
      console.error('Stack:', err.stack);
    }
    if (err && err.original) {
      console.error('Sequelize original error:', err.original);
    }
    next(err);
  }
};

export const getUsers = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
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
  res.json({ success: true, data: result.users, ...result });
  } catch (err: any) {
    next(err);
  }
};

export const getUserById = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
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
    console.log('[DEBUG] Returning user from getUserById:', {
      id: user.id,
      username: user.username,
      cumulative_value: user.cumulative_value,
      balance: user.balance
    });
    res.json({ message: 'User retrieved successfully', user });
  } catch (err: any) {
    next(err);
  }
};

export const updateUser = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
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
  console.log('[DEBUG] Returning user from updateUser:', {
    id: user?.id,
    username: user?.username,
    cumulative_value: user?.cumulative_value,
    balance: user?.balance
  });
  res.json({ message: 'User updated successfully', user });
  } catch (err: any) {
    next(err);
  }
};

export const resetPassword = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
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

    if (req.user?.id !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await userService.resetPassword(id, parsed.data);
    res.json({ message: 'Password reset successfully' });
  } catch (err: any) {
    next(err);
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
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
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    next(err);
  }
};

export const getCurrentUser = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

  const user: UserDTO | null = await userService.getUserById(req.user.id, req.user);
  console.log('[DEBUG] Returning user from getCurrentUser:', {
    id: user?.id,
    username: user?.username,
    cumulative_value: user?.cumulative_value,
    balance: user?.balance
  });
  res.json({ message: 'Current user retrieved successfully', user });
  } catch (err: any) {
    next(err);
  }
};
