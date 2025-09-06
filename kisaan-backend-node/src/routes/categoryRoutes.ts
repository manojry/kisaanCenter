import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';

export const categoryRoutes = Router();

// Category CRUD routes
categoryRoutes.get('/', categoryController.getAllCategories);
categoryRoutes.get('/active', categoryController.getActiveCategories);
categoryRoutes.get('/search', categoryController.searchCategories);
categoryRoutes.get('/:id', categoryController.getCategoryById);
categoryRoutes.post('/', categoryController.createCategory);
categoryRoutes.put('/:id', categoryController.updateCategory);
categoryRoutes.patch('/:id/deactivate', categoryController.deactivateCategory);
categoryRoutes.patch('/reorder', categoryController.reorderCategories);
categoryRoutes.delete('/:id', categoryController.deleteCategory);

// Add route logging middleware
categoryRoutes.use((req, res, next) => {
  console.log(`Category route: ${req.method} ${req.path}`);
  next();
});
