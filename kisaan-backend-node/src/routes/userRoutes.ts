import { Router } from 'express';
import { authenticateToken, requireRole, requireSelfOrAdmin } from '../middlewares/auth';
import {
	getCurrentUser,
	createUser,
	getUsers,
	getUserById,
	updateUser,
	deleteUser,
	resetPassword,
	adminResetPassword
} from '../controllers/userController';

const router = Router();

// Authentication disabled for testing
router.use(authenticateToken);

// Get current user profile (must be first to avoid conflict with /:id)
router.get('/me', getCurrentUser);

// User CRUD operations
router.post('/', createUser);
router.get('/', getUsers); // Role-based filtering handled in service
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Password reset (users can only reset their own password)
router.post('/:id/reset-password', resetPassword);

// Admin password reset (superadmin/owner can reset user passwords)
router.post('/:id/admin-reset-password', adminResetPassword);

export default router;
