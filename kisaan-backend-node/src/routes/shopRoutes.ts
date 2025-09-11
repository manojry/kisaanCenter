
import { Router } from 'express';
import * as shopController from '../controllers/shopController';
import * as shopProductsController from '../controllers/shopProductsController';
import { authenticateToken } from '../middlewares/auth';

export const shopRoutes = Router();

// Authentication disabled for testing
// shopRoutes.use(authenticateToken);

shopRoutes.get('/', shopController.getShops);
shopRoutes.get('/:id', shopController.getShopById);
shopRoutes.get('/:id/products', shopProductsController.getShopProducts);

// Shop-Product mapping routes
// Assign a product to a shop
shopRoutes.post('/:shopId/products/:productId', shopProductsController.assignProductToShop);
// Remove a product from a shop
shopRoutes.delete('/:shopId/products/:productId', shopProductsController.removeProductFromShop);
// Toggle product active status for a shop
shopRoutes.patch('/:shopId/products/:productId', shopProductsController.toggleProductActiveStatus);
shopRoutes.post('/', shopController.createShop);
shopRoutes.put('/:id', shopController.updateShop);
shopRoutes.delete('/:id', shopController.deleteShop);

// Add route logging middleware


// Add route logging middleware (moved to the end)
shopRoutes.use((req, res, next) => {
  console.log(`Shop route: ${req.method} ${req.path}`);
  next();
});
