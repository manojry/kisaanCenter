import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

console.log('🔧 Product routes file loaded');

// Apply authentication middleware to all routes
// router.use(authenticateToken); // Temporarily disabled for testing

// Product routes
console.log('🔧 Setting up product routes...');
router.get('/test', (req, res) => {
  console.log('🧪 Test route hit!');
  res.json({ message: 'Products test route working!' });
});
router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
console.log('🔧 Product routes configured');

export const productRoutes = router;
