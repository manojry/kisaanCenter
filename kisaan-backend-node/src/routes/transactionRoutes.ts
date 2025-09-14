import express from 'express';
import { TransactionController } from '../controllers/transactionController';
import { PaymentController } from '../controllers/paymentController';
import { CreateTransactionSchema } from '../schemas/transaction';
import { CreatePaymentSchema, UpdatePaymentStatusSchema } from '../schemas/payment';
import { authenticateToken } from '../middlewares/auth';
import { validateSchema } from '../middlewares/validation';

const router = express.Router();
const transactionController = new TransactionController();
const paymentController = new PaymentController();

// Authentication disabled for testing
// router.use(authenticateToken);

// Transaction routes - Block superadmin access to individual transactions
// SMART: Use service for dashboard-friendly enriched transactions
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const { shop_id, farmer_id, buyer_id, startDate, endDate, from_date, to_date } = req.query;
    const TransactionService = require('../services/transactionService').TransactionService;
    const service = new TransactionService();
    let filters: any = {};
    if (shop_id) filters.shopId = Number(shop_id);
    if (farmer_id) filters.farmerId = Number(farmer_id);
    if (buyer_id) filters.buyerId = Number(buyer_id);

    // Support both frontend (from_date/to_date) and backend (startDate/endDate) query params
    let filterStart: string | undefined = (from_date as string) || (startDate as string);
    let filterEnd: string | undefined = (to_date as string) || (endDate as string);

    // If no date filter provided, default to today
    if (!filterStart || !filterEnd) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      // Start of day
      filterStart = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
      // End of day
      filterEnd = `${yyyy}-${mm}-${dd}T23:59:59.999Z`;
    }
    filters.startDate = new Date(filterStart);
    filters.endDate = new Date(filterEnd);

    // Default: if owner, use their shop; if farmer/buyer, use their id
    if (req.user?.role === 'owner' && req.user?.shop_id && !filters.shopId) {
      filters.shopId = Number(req.user.shop_id);
    }
    if (req.user?.role === 'farmer' && !filters.farmerId) {
      filters.farmerId = Number(req.user.id);
    }
    if (req.user?.role === 'buyer' && !filters.buyerId) {
      filters.buyerId = Number(req.user.id);
    }
    // Only call if shopId or farmerId or buyerId is present
    if (!filters.shopId && !filters.farmerId && !filters.buyerId) {
      return res.status(400).json({ success: false, message: 'Missing shop, farmer, or buyer context' });
    }
    let transactions: any[] = [];
    if (filters.shopId) {
      transactions = await service.getTransactionsByShop(filters.shopId, filters);
    } else if (filters.farmerId) {
      const farmerResult = await service.getFarmerEarnings(filters.farmerId, filters.shopId, filters.period || undefined);
      transactions = Array.isArray(farmerResult?.transactions) ? farmerResult.transactions : [];
    } else if (filters.buyerId) {
      transactions = await service.getTransactionsByBuyer(filters.buyerId, filters);
    }
    res.json({
      success: true,
      data: transactions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

router.post('/', validateSchema(CreateTransactionSchema), transactionController.createTransaction.bind(transactionController));
router.get('/analytics', async (req, res) => {
  try {
    const { sequelize } = require('../models/index');
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_sale_value) as total_sales,
        SUM(shop_commission) as total_commission,
        SUM(farmer_earning) as total_farmer_earnings
      FROM kisaan_transactions
    `);
    res.json({
      success: true,
      data: Array.isArray(results) ? results[0] : results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction analytics',
      error: error.message
    });
  }
});

// Specific routes must come before parameterized routes
router.get('/shop/:shopId/list', transactionController.getTransactionsByShop.bind(transactionController));
router.get('/farmer/:farmerId/list', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { sequelize } = require('../models/index');
    const [results] = await sequelize.query(
      'SELECT * FROM kisaan_transactions WHERE farmer_id = :farmerId ORDER BY created_at DESC',
      { replacements: { farmerId } }
    );
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/buyer/:buyerId/list', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { sequelize } = require('../models/index');
    const [results] = await sequelize.query(
      'SELECT * FROM kisaan_transactions WHERE buyer_id = :buyerId ORDER BY created_at DESC',
      { replacements: { buyerId } }
    );
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', transactionController.getTransactionById.bind(transactionController));
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { sequelize } = require('../models/index');
    
    const setClause = Object.keys(updateData)
      .filter(key => !['id', 'created_at'].includes(key))
      .map(key => `${key} = :${key}`)
      .join(', ');
    
    if (!setClause) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    const [results] = await sequelize.query(
      `UPDATE kisaan_transactions SET ${setClause}, updated_at = NOW() 
       WHERE id = :id RETURNING *`,
      { replacements: { ...updateData, id } }
    );
    
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: Array.isArray(results) ? results[0] : results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sequelize } = require('../models/index');
    
    const [results] = await sequelize.query(
      'DELETE FROM kisaan_transactions WHERE id = :id RETURNING *',
      { replacements: { id } }
    );
    
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  }
});

router.get('/shop/:shopId', transactionController.getTransactionsByShop.bind(transactionController));
router.get('/shop/:shopId/earnings', transactionController.getShopEarnings.bind(transactionController));

// Farmer and buyer reporting endpoints
router.get('/farmer/:farmerId/earnings', transactionController.getFarmerEarnings.bind(transactionController));
router.get('/farmers/:farmerId/payments', paymentController.getPaymentsToFarmer.bind(paymentController));
router.get('/buyers/:buyerId/payments', paymentController.getPaymentsByBuyer.bind(paymentController));
router.get('/buyers/:buyerId/purchases', transactionController.getPurchasesByBuyer.bind(transactionController));

// Payment routes
router.post('/payments', validateSchema(CreatePaymentSchema), paymentController.createPayment.bind(paymentController));
router.put('/payments/:id/status', validateSchema(UpdatePaymentStatusSchema), paymentController.updatePaymentStatus.bind(paymentController));
router.get('/payments/transaction/:transactionId', paymentController.getPaymentsByTransaction.bind(paymentController));
router.get('/payments/outstanding', paymentController.getOutstandingPayments.bind(paymentController));

export { router as transactionRoutes };