import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import { UserCreateSchema, UserUpdateSchema } from '../schemas/user';

// Create a new user
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UserCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }
    const user = await User.create(parsed.data);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

// Get all users
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Get a user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update a user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UserUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update(parsed.data);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
