import { Router } from 'express';
import * as shopCategoryController from '../controllers/shopCategoryController';
import { unassignCategoryFromShop } from '../controllers/shopCategoryController';

export const shopCategoryRoutes = Router();
// Get categories for a specific shop (for /api/shop-categories/shop/:shopId)
shopCategoryRoutes.get('/shop/:shopId', shopCategoryController.getShopCategories);

// Unassign a single category from a shop (for /api/shop-categories/unassign)
shopCategoryRoutes.delete('/unassign', unassignCategoryFromShop);

// Shop-Category assignment routes
shopCategoryRoutes.post('/assign', shopCategoryController.assignCategoriesToShop);
shopCategoryRoutes.post('/remove', shopCategoryController.removeCategoriesFromShop);
shopCategoryRoutes.get('/assignments', shopCategoryController.getShopCategoryAssignments);
shopCategoryRoutes.get('/shop/:shopId/categories', shopCategoryController.getShopCategories);
shopCategoryRoutes.get('/category/:categoryId/shops', shopCategoryController.getCategoryShops);
shopCategoryRoutes.get('/check/:shopId/:categoryId', shopCategoryController.checkShopCategoryAssignment);
shopCategoryRoutes.delete('/shop/:shopId/categories', shopCategoryController.removeAllCategoriesFromShop);

// Add route logging middleware
shopCategoryRoutes.use((req, res, next) => {
  console.log(`Shop-Category route: ${req.method} ${req.path}`);
  next();
});
