import express from 'express';
import { TransactionController, PaymentController } from '../controllers';
import { CreateTransactionSchema } from '../schemas/transaction';
import { CreatePaymentSchema, UpdatePaymentStatusSchema } from '../schemas/payment';
import { authenticateToken } from '../middlewares/auth';
import { validateSchema } from '../middlewares/validation';

const router = express.Router();
const transactionController = new TransactionController();
const paymentController = new PaymentController();
// Use controller instances from central index

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
      filterStart = `${yyyy}-${mm}-${dd}`;
      filterEnd = `${yyyy}-${mm}-${dd}`;
    }

    // If date string is in YYYY-MM-DD format, expand to full day
    const expandToFullDay = (dateStr: string, isEnd: boolean) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return isEnd
          ? `${dateStr}T23:59:59.999Z`
          : `${dateStr}T00:00:00.000Z`;
      }
      return dateStr;
    };
    filterStart = expandToFullDay(filterStart, false);
    filterEnd = expandToFullDay(filterEnd, true);
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
    console.log(`[DEBUG] Returning ${transactions.length} transactions for shop_id=${filters.shopId}, date range:`, filters.startDate, filters.endDate);
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
    const { shop_id } = req.query;
    let { date_from, date_to } = req.query;
    // If no date_from or date_to, default both to today
    if (!date_from || !date_to) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      date_from = `${yyyy}-${mm}-${dd}`;
      date_to = `${yyyy}-${mm}-${dd}`;
    }
    let whereClause = '';
    let params: any[] = [];
    if (date_from && date_to) {
      whereClause = `WHERE created_at >= ? AND created_at <= ?`;
      params.push(date_from, date_to);
    }
    if (shop_id) {
      whereClause += params.length ? ' AND shop_id = ?' : ' WHERE shop_id = ?';
      params.push(shop_id);
    }
    // Get total sales and commission per day
    const [dailyResults] = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_sale_value) as total_sales,
        SUM(shop_commission) as total_commission
      FROM kisaan_transactions
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `, { replacements: params });
    // Get overall aggregates
    const [aggResults] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_sale_value) as total_sales,
        SUM(shop_commission) as total_commission,
        SUM(farmer_earning) as total_farmer_earnings
      FROM kisaan_transactions
      ${whereClause}
    `, { replacements: params });
    // Calculate status_summary for chart: total sales (paid), pending to farmer, pending from buyer
    const [totalSalesResult] = await sequelize.query(`
      SELECT COALESCE(SUM(total_sale_value),0) as total_sales FROM kisaan_transactions ${whereClause}
    `, { replacements: params });
    const total_sales = Number((Array.isArray(totalSalesResult) ? totalSalesResult[0]?.total_sales : 0) || 0);

    // 2. Pending payments to farmer (sum of farmer_earning - paid to farmer)
    const [pendingToFarmerResult] = await sequelize.query(`
      SELECT COALESCE(SUM(t.farmer_earning - COALESCE(p.paid,0)),0) as pending_to_farmer
      FROM kisaan_transactions t
      LEFT JOIN (
        SELECT transaction_id, SUM(amount) as paid
        FROM kisaan_payments
        WHERE payer_type = 'SHOP' AND payee_type = 'FARMER' AND status = 'PAID'
        GROUP BY transaction_id
      ) p ON t.id = p.transaction_id
      ${whereClause}
    `, { replacements: params });
    const pending_to_farmer = Number((Array.isArray(pendingToFarmerResult) ? pendingToFarmerResult[0]?.pending_to_farmer : 0) || 0);

    // 3. Pending payments from buyer (sum of total_sale_value - paid by buyer)
    const [pendingFromBuyerResult] = await sequelize.query(`
      SELECT COALESCE(SUM(t.total_sale_value - COALESCE(p.paid,0)),0) as pending_from_buyer
      FROM kisaan_transactions t
      LEFT JOIN (
        SELECT transaction_id, SUM(amount) as paid
        FROM kisaan_payments
        WHERE payer_type = 'BUYER' AND payee_type = 'SHOP' AND status = 'PAID'
        GROUP BY transaction_id
      ) p ON t.id = p.transaction_id
      ${whereClause}
    `, { replacements: params });
    const pending_from_buyer = Number((Array.isArray(pendingFromBuyerResult) ? pendingFromBuyerResult[0]?.pending_from_buyer : 0) || 0);

    const total_deficit = pending_to_farmer + pending_from_buyer;
    const status_summary = {
      total_sales,
      pending_to_farmer,
      pending_from_buyer
    };
    res.json({
      success: true,
      data: {
        ...((Array.isArray(aggResults) ? aggResults[0] : aggResults) || {}),
        total_deficit,
        daily: dailyResults || [],
        status_summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction analytics',
      error: (error as any).message
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