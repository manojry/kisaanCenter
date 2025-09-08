import express from 'express';
import * as transactionController from '../controllers/transactionController';
import { 
  validateTransactionCreation, 
  validateTransactionUpdate, 
  validatePagination,
  validateBulkTransactionCreation,
  validatePaymentUpdate,
  checkTransactionAccess 
} from '../middleware/transactionMiddleware';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

console.log('🔧 Transaction routes being registered...');

// ===== TEST ROUTE =====
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Transaction routes are working!' });
});

// ===== ANALYTICS ROUTES (no auth for testing) =====
router.get('/analytics/summary', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      total_transactions: 0,
      total_sales: 0,
      total_commission: 0,
      pending_count: 0,
      completed_count: 0,
      credit_count: 0
    }
  });
});
router.get('/analytics/daily/:date', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      date: req.params.date,
      total_transactions: 0,
      total_sales: 0,
      by_status: {}
    }
  });
});

// ===== TEST ROUTE WITHOUT AUTH =====
router.get('/no-auth', transactionController.getTransactions);

// Apply authentication to remaining routes
router.use(authenticateToken);

// ===== CORE TRANSACTION ROUTES =====
router.get('/', validatePagination, transactionController.getTransactions);
router.get('/analytics', transactionController.getAnalyticsSummary);
router.get('/:id', checkTransactionAccess, transactionController.getTransaction);
router.post('/', validateTransactionCreation, transactionController.createTransaction);
router.put('/:id', validateTransactionUpdate, checkTransactionAccess, transactionController.updateTransaction);
router.delete('/:id', checkTransactionAccess, transactionController.deleteTransaction);

// ===== TRANSACTION TYPE SPECIFIC =====
router.post('/sale', validateTransactionCreation, transactionController.createSale);
router.post('/purchase', validateTransactionCreation, transactionController.createPurchase);
router.post('/credit', validateTransactionCreation, transactionController.createCredit);
router.post('/return', validateTransactionCreation, transactionController.createReturn);
router.post('/bulk', validateBulkTransactionCreation, transactionController.createBulkTransactions);

// ===== TRANSACTION STATUS MANAGEMENT =====
router.patch('/:id/complete', checkTransactionAccess, transactionController.completeTransaction);
router.patch('/:id/cancel', checkTransactionAccess, transactionController.cancelTransaction);

// ===== PAYMENT MANAGEMENT =====
router.patch('/:id/payment/buyer', validatePaymentUpdate, checkTransactionAccess, transactionController.updateBuyerPayment);
router.patch('/:id/payment/farmer', validatePaymentUpdate, checkTransactionAccess, transactionController.updateFarmerPayment);

// ===== QUERY ROUTES =====
router.get('/incomplete/list', validatePagination, transactionController.getIncompleteTransactions);
router.get('/search/query', validatePagination, transactionController.searchTransactions);
router.get('/shop/:shopId/list', validatePagination, transactionController.getTransactionsByShop);
router.get('/buyer/:buyerId/list', validatePagination, transactionController.getTransactionsByBuyer);
router.get('/farmer/:farmerId/list', validatePagination, transactionController.getTransactionsByFarmer);



// ===== REPORTING ROUTES =====
router.get('/export/csv', validatePagination, transactionController.exportTransactionsCSV);
router.get('/:id/receipt', checkTransactionAccess, transactionController.getTransactionReceipt);
router.get('/:id/summary', checkTransactionAccess, transactionController.getTransactionSummary);


console.log('✅ Transaction routes registered successfully');

export { router as transactionRoutes }