import { Router } from 'express';
import * as shopController from '../controllers/shopController';
// import { authenticateToken } from '../middlewares/auth';

export const shopRoutes = Router();

// All routes without authentication for testing
shopRoutes.get('/', shopController.getShops);
shopRoutes.get('/:id', shopController.getShopById);
shopRoutes.post('/', shopController.createShop);
shopRoutes.put('/:id', shopController.updateShop);
shopRoutes.delete('/:id', shopController.deleteShop);

// Add route logging middleware
shopRoutes.use((req, res, next) => {
  console.log(`Shop route: ${req.method} ${req.path}`);
  next();
});
