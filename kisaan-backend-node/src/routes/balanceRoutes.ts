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

// Get shop balance
router.get('/shop/:shopId', [
  param('shopId').notEmpty().withMessage('Shop ID is required')
], balanceController.getShopBalance);

// Update balance
router.post('/update', [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('amount').isFloat().withMessage('Amount is required'),
  body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit')
], balanceController.updateBalance);

// Get balance history
router.get('/history/:userId', [
  param('userId').notEmpty().withMessage('User ID is required')
], balanceController.getBalanceHistory);

export { router as balanceRoutes };