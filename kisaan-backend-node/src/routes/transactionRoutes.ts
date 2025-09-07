import express from 'express';
import * as transactionController from '../controllers/transactionController';

const router = express.Router();

// Debug middleware to see what's happening
const debugMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('=== TRANSACTION ROUTE DEBUG ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', req.headers);
  console.log('================================');
  next();
};

router.post('/', debugMiddleware, transactionController.createTransaction);
router.post('/sale', debugMiddleware, transactionController.createSale);
router.get('/', debugMiddleware, transactionController.getTransactions);
router.get('/:id', debugMiddleware, transactionController.getTransaction);

export { router as transactionRoutes };