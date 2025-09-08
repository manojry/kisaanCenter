import express from 'express';
import * as balanceController from '../controllers/balanceController';
import { authenticateToken } from '../middlewares/auth';
import { body, param } from 'express-validator';

const router = express.Router();

router.use(authenticateToken);

// Payment validation
const validatePayment = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('shop_id').isInt().withMessage('Shop ID is required'),
  body('description').optional().isString()
];

// Add payment to farmer
router.post('/payment/farmer', [
  ...validatePayment,
  body('farmer_id').notEmpty().withMessage('Farmer ID is required')
], balanceController.addPaymentToFarmer);

// Add payment from buyer  
router.post('/payment/buyer', [
  ...validatePayment,
  body('buyer_id').notEmpty().withMessage('Buyer ID is required')
], balanceController.addPaymentFromBuyer);

// Get user balance
router.get('/user/:userId', [
  param('userId').notEmpty().withMessage('User ID is required')
], balanceController.getUserBalance);

export { router as balanceRoutes };