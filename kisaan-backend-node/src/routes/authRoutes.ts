import { Router } from 'express';
import { loginController } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/login', loginController);
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
});


export default router;
export { router as authRoutes };
