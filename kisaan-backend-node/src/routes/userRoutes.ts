import { Router } from 'express';
import { authenticateToken, requireRole, requireSelfOrAdmin } from '../middlewares/auth';
import * as userController from '../controllers/userController';

const router = Router();

// Authentication disabled for testing
router.use(authenticateToken);

// Get current user profile (must be first to avoid conflict with /:id)
router.get('/me', userController.getCurrentUser);

// User CRUD operations
router.post('/', userController.createUser);
router.get('/', userController.getUsers); // Role-based filtering handled in service
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Password reset (users can only reset their own password)
router.post('/:id/reset-password', userController.resetPassword);

// Admin password reset (superadmin/owner can reset user passwords)
router.post('/:id/admin-reset-password', userController.adminResetPassword);

export default router;
