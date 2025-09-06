import { Router } from 'express';
import * as shopCategoryController from '../controllers/shopCategoryController';

export const shopCategoryRoutes = Router();

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
