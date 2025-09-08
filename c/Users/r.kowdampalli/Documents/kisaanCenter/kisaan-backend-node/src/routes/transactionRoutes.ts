
// Purchase transaction type
router.post('/purchase', debugMiddleware, validateTransactionCreation, transactionController.createPurchase);

// Credit transaction type
router.post('/credit', debugMiddleware, validateTransactionCreation, transactionController.createCredit);

// Return/refund transaction type
router.post('/return', debugMiddleware, validateTransactionCreation, transactionController.createReturn);

// Bulk transaction creation
router.post('/bulk', debugMiddleware, validateTransactionCreation, transactionController.createBulkTransactions);

// ===== ADDITIONAL ANALYTICS ROUTES =====

// Get daily transaction summary
router.get('/analytics/daily/:date', debugMiddleware, transactionController.getDailyAnalytics);

// Get monthly transaction summary
router.get('/analytics/monthly/:year/:month', debugMiddleware, transactionController.getMonthlyAnalytics);

// Get transaction trends
router.get('/analytics/trends', debugMiddleware, transactionController.getTransactionTrends);

// ===== REPORTING ROUTES =====

// Export transactions to CSV
router.get('/export/csv', debugMiddleware, validatePagination, transactionController.exportTransactionsCSV);

// Get transaction receipt
router.get('/:id/receipt', debugMiddleware, checkTransactionAccess, transactionController.getTransactionReceipt);
