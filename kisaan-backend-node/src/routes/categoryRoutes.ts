import { Router } from 'express';
import { CategoryController } from '../controllers';

export const categoryRoutes = Router();

const categoryController = new CategoryController();
// Category CRUD routes
categoryRoutes.get('/', categoryController.getAllCategories.bind(categoryController));
categoryRoutes.get('/active', categoryController.getActiveCategories.bind(categoryController));
categoryRoutes.get('/search', categoryController.searchCategories.bind(categoryController));
categoryRoutes.get('/:id', categoryController.getCategoryById.bind(categoryController));
categoryRoutes.post('/', categoryController.createCategory.bind(categoryController));
categoryRoutes.put('/:id', categoryController.updateCategory.bind(categoryController));
categoryRoutes.patch('/:id/deactivate', categoryController.deactivateCategory.bind(categoryController));
categoryRoutes.patch('/reorder', categoryController.reorderCategories.bind(categoryController));
categoryRoutes.delete('/:id', categoryController.deleteCategory.bind(categoryController));

// Add route logging middleware
categoryRoutes.use((req, res, next) => {
  console.log(`Category route: ${req.method} ${req.path}`);
  next();
});
