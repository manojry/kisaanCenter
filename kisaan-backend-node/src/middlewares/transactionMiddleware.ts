
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
export const validateTransactionCreation = [
  body('shop_id').isInt().withMessage('Shop ID must be an integer'),
  body('farmer_id').notEmpty().withMessage('Farmer ID is required'),
  body('buyer_id').notEmpty().withMessage('Buyer ID is required'),
  body('product_id').isInt().withMessage('Product ID must be an integer'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be positive'),
  body('type').optional().isIn(['sale', 'purchase', 'credit', 'return']).withMessage('Invalid transaction type'),
  body('commission_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0-100'),
  body('payment_method').optional().isIn(['cash', 'credit', 'bank_transfer', 'upi']).withMessage('Invalid payment method'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const validateTransactionUpdate = [
  param('id').isInt().withMessage('Transaction ID must be an integer'),
  body('status').optional().isIn(['pending', 'completed', 'cancelled', 'partial', 'credit', 'farmer_due']).withMessage('Invalid status'),
  body('quantity').optional().isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
  body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be positive'),
  body('farmer_paid').optional().isFloat({ min: 0 }).withMessage('Farmer paid amount must be non-negative'),
  body('buyer_paid').optional().isFloat({ min: 0 }).withMessage('Buyer paid amount must be non-negative'),
  body('payment_method').optional().isIn(['cash', 'credit', 'bank_transfer', 'upi']).withMessage('Invalid payment method'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('shop_id').optional().isInt().withMessage('Shop ID must be an integer'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Validate payment updates
export const validatePaymentUpdate = [
  param('id').isInt().withMessage('Transaction ID must be an integer'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be non-negative'),
  body('payment_method').optional().isIn(['cash', 'credit', 'bank_transfer', 'upi']).withMessage('Invalid payment method'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Authorization middleware
export const checkTransactionAccess = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const transactionId = req.params.id;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // For now, allow access - implement proper authorization based on user role
    // TODO: Check if user has access to this transaction based on shop ownership, etc.
    
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// Validate bulk transaction creation
export const validateBulkTransactionCreation = [
  body('transactions').isArray({ min: 1 }).withMessage('Transactions array is required and must not be empty'),
  body('transactions.*.shop_id').isInt().withMessage('Shop ID must be an integer'),
  body('transactions.*.farmer_id').notEmpty().withMessage('Farmer ID is required'),
  body('transactions.*.buyer_id').notEmpty().withMessage('Buyer ID is required'),
  body('transactions.*.product_id').isInt().withMessage('Product ID must be an integer'),
  body('transactions.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
  body('transactions.*.price').isFloat({ min: 0.01 }).withMessage('Price must be positive'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
