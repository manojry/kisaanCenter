import { Request, Response, NextFunction } from 'express';
import { LoginSchema } from '../schemas/auth';
import { loginUser } from '../services/authService';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
  return res.status(400).json({ error: parsed.error.issues });
    }
    const result = await loginUser(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
