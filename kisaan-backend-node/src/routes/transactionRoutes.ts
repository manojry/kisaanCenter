import express from 'express';
import * as transactionController from '../controllers/transactionController';

const router = express.Router();

router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions); // Get multiple transactions with filters
router.get('/:id', transactionController.getTransaction); // Get single transaction by ID

export { router as transactionRoutes };
