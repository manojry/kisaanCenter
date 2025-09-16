import { Router } from 'express';
import { ShopController } from '../controllers/shopController';
import * as shopProductsController from '../controllers/shopProductsController';
import { authenticateToken } from '../middlewares/auth';

export const shopRoutes = Router();
const shopController = new ShopController();

// Authentication disabled for testing
// shopRoutes.use(authenticateToken);

// Owner-related routes
shopRoutes.get('/available-owners', shopController.getAvailableOwners.bind(shopController));

// Shop CRUD routes
shopRoutes.get('/', shopController.getShops.bind(shopController));
shopRoutes.get('/:id', shopController.getShopById.bind(shopController));
shopRoutes.post('/', shopController.createShop.bind(shopController));
shopRoutes.put('/:id', shopController.updateShop.bind(shopController));
shopRoutes.delete('/:id', shopController.deleteShop.bind(shopController));

// Shop-Product mapping routes
shopRoutes.get('/:id/products', shopProductsController.getShopProducts);
shopRoutes.get('/:id/available-products', shopProductsController.getAvailableProductsForShop);
shopRoutes.post('/:shopId/products/:productId', shopProductsController.assignProductToShop);
shopRoutes.delete('/:shopId/products/:productId', shopProductsController.removeProductFromShop);
shopRoutes.patch('/:shopId/products/:productId', shopProductsController.toggleProductActiveStatus);

// Shop-Category routes
shopRoutes.get('/:id/categories', require('../controllers/shopCategoryController').getShopCategories);

// Add route logging middleware (at the end)
shopRoutes.use((req, res, next) => {
  console.log(`Shop route: ${req.method} ${req.path}`);
  next();
});
