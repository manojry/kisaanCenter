import { Router } from 'express';
import { authenticateToken, requireRole, requireSelfOrAdmin } from '../middlewares/auth';
import * as userController from '../controllers/userController';

const router = Router();

// Apply authentication to all user routes
router.use(authenticateToken);

// Get current user profile (must be first to avoid conflict with /:id)
router.get('/me', userController.getCurrentUser);

// User CRUD operations
router.post('/', requireRole(['superadmin', 'owner']), userController.createUser);
router.get('/', userController.getUsers); // Role-based filtering handled in service
router.get('/:id', requireSelfOrAdmin(), userController.getUserById);
router.put('/:id', requireSelfOrAdmin(), userController.updateUser);
router.delete('/:id', requireRole(['superadmin', 'owner']), userController.deleteUser);

// Password reset (users can only reset their own password)
router.post('/:id/reset-password', userController.resetPassword);

export default router;
