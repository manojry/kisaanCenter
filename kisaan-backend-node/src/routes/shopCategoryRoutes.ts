import { Router } from 'express';
import { ShopCategoryController } from '../controllers';
import { authenticateToken } from '../middlewares/auth';

export const shopCategoryRoutes = Router();

// Apply authentication to all routes
// shopCategoryRoutes.use(authenticateToken); // Disabled for testing

const shopCategoryController = new ShopCategoryController();

// Get categories for a specific shop
shopCategoryRoutes.get('/shop/:shopId', shopCategoryController.getShopCategories.bind(shopCategoryController));

// Assign/remove category to/from shop
shopCategoryRoutes.post('/shop/:shopId/category/:categoryId', shopCategoryController.assignCategoryToShop.bind(shopCategoryController));
shopCategoryRoutes.delete('/shop/:shopId/category/:categoryId', shopCategoryController.removeCategoryFromShop.bind(shopCategoryController));

// Add route logging middleware
shopCategoryRoutes.use((req, res, next) => {
  console.log(`Shop-Category route: ${req.method} ${req.path}`);
  next();
});
