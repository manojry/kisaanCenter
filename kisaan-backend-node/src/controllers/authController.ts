import { Request, Response, NextFunction } from 'express';
import { LoginSchema } from '../schemas/auth';
import { loginUser } from '../services/authService';

class AuthController {
  async loginController(req: Request, res: Response, next: NextFunction) {
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

  async logoutController(req: Request, res: Response) {
    // Implementation for logout
  }
  
  async refreshTokenController(req: Request, res: Response) {
    // Implementation for refresh token
  }
  
  async verifyController(req: Request, res: Response) {
    // Implementation for verify
  }
}

const authController = new AuthController();
export { authController };
export const loginController = authController.loginController.bind(authController);
