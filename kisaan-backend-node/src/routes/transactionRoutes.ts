import express from 'express';
import { TransactionController, PaymentController } from '../controllers';
import { CreateTransactionSchema } from '../schemas/transaction';
import { CreatePaymentSchema, UpdatePaymentStatusSchema } from '../schemas/payment';
import { authenticateToken } from '../middlewares/auth';
import { loadFeatures, enforceRetention, requireFeature } from '../middlewares/features';
import { validateSchema } from '../middlewares/validation';
import { mapTransactionResponse } from '../utils/transactionMapper';
import { paginationParser } from '../middleware/pagination';
import { normalizeDateRange } from '../utils/dateRange';
import { success, created, failureCode } from '../shared/http/respond';
import { buildPaginationMeta } from '../middleware/pagination';
import { ErrorCodes } from '../shared/errors/errorCodes';

const router = express.Router();
const transactionController = new TransactionController();
const paymentController = new PaymentController();
// Use controller instances from central index

// Authentication disabled for testing
// router.use(authenticateToken);

// Transaction routes - Block superadmin access to individual transactions
// SMART: Use service for dashboard-friendly enriched transactions
// Apply feature gating & retention: transactions.list controls access; retention clamps date range
import type { Request } from 'express';
type ReqWithUser = Request & { user?: { id?: number; role?: string; shop_id?: number | null } };
router.get('/', authenticateToken, loadFeatures, requireFeature('transactions.list'), enforceRetention('from_date','to_date'), paginationParser, async (req: ReqWithUser, res, next) => {
  try {
  const { shop_id, farmer_id, buyer_id, startDate, endDate, from_date, to_date, order_by, order_dir } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TransactionService = require('../services/transactionService').TransactionService;
    const service = new TransactionService();
  const filters: Record<string, unknown> = {};
    if (shop_id) filters.shopId = Number(shop_id);
    if (farmer_id) filters.farmerId = Number(farmer_id);
    if (buyer_id) filters.buyerId = Number(buyer_id);

    const getString = (v: unknown) => (typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : undefined);
    const range = normalizeDateRange({
      start: getString(from_date) || getString(startDate),
      end: getString(to_date) || getString(endDate),
      defaultToToday: true
    });
    if (range) {
      filters.startDate = range.start;
      filters.endDate = range.end;
    }
    if (req.user?.role === 'owner' && req.user?.shop_id && !filters.shopId) filters.shopId = Number(req.user.shop_id);
    if (req.user?.role === 'farmer' && !filters.farmerId) filters.farmerId = Number(req.user.id);
    if (req.user?.role === 'buyer' && !filters.buyerId) filters.buyerId = Number(req.user.id);
    if (!filters.shopId && !filters.farmerId && !filters.buyerId) {
  return failureCode(res, 400, ErrorCodes.TRANSACTION_CONTEXT_REQUIRED, undefined, 'Missing shop, farmer, or buyer context');
    }
    let rows: unknown[] = [];
    let count = 0;
    // If shop-scoped query, delegate to the shop service which applies robust date parsing and filters
    if (filters.shopId) {
      const txService = new TransactionService();
      const txs = await txService.getTransactionsByShop(Number(filters.shopId), { startDate: filters.startDate as Date | undefined, endDate: filters.endDate as Date | undefined, farmerId: filters.farmerId as number | undefined, buyerId: filters.buyerId as number | undefined });
      rows = txs;
      count = txs.length;
    } else {
      const result = await service['transactionRepository'].findByFilters({
        shopId: filters.shopId,
        farmerId: filters.farmerId,
        buyerId: filters.buyerId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: req.pagination?.limit,
        offset: req.pagination?.offset,
        orderBy: order_by as string | undefined,
        orderDir: (order_dir as string | undefined)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      });
      rows = result.rows;
      count = result.count;
    }
  const meta = req.pagination ? buildPaginationMeta(count, req.pagination) : { total: count };
  return success(res, rows, { meta: meta as unknown as Record<string, unknown> });
  } catch (err) {
    next(err);
  }
});

// Only superadmin, owner, or farmer can create transactions. Explicitly block buyer role.
router.post('/', authenticateToken, (req: ReqWithUser, res, next) => {
  if (req.user?.role === 'buyer') {
    return failureCode(res, 403, ErrorCodes.ACCESS_DENIED, { role: req.user.role }, 'Buyers are not allowed to create transactions');
  }
  next();
}, validateSchema(CreateTransactionSchema), transactionController.createTransaction.bind(transactionController));
// Quick transaction endpoint (assignment aware): payload { shop_id?, farmer_id, buyer_id, quantity, unit_price, product_id?, product_name?, category_id }
router.post('/quick', authenticateToken, async (req: ReqWithUser, res, next) => {
  if (req.user?.role === 'buyer') {
    return failureCode(res, 403, ErrorCodes.ACCESS_DENIED, { role: req.user.role }, 'Buyers are not allowed to create transactions');
  }
  try {
    const { farmer_id, buyer_id, quantity, unit_price, product_id, product_name, category_id, shop_id } = req.body || {};
    if (!farmer_id || !buyer_id || !quantity || !unit_price) {
      return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { fields: ['farmer_id','buyer_id','quantity','unit_price'] }, 'farmer_id, buyer_id, quantity, unit_price are required');
    }
    const inferredShopId = shop_id || req.user?.shop_id;
    if (!inferredShopId) {
      return failureCode(res, 400, ErrorCodes.TRANSACTION_CONTEXT_REQUIRED, undefined, 'Shop context required');
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TransactionService = require('../services/transactionService').TransactionService;
    const service = new TransactionService();
    const txn = await service.createQuickTransaction({
      shop_id: Number(inferredShopId),
      farmer_id: Number(farmer_id),
      buyer_id: Number(buyer_id),
      product_id: product_id ? Number(product_id) : undefined,
      product_name: product_name,
      category_id: category_id ? Number(category_id) : 1,
      quantity: Number(quantity),
      unit_price: Number(unit_price)
    }, req.user ? { role: req.user.role, id: req.user.id } : undefined);
    return created(res, mapTransactionResponse(txn), { message: 'Quick transaction created' });
  } catch (error: unknown) {
    next(error);
  }
});

// Analytics requires transactions.analytics feature; also enforce retention window on date_from/date_to
router.get('/analytics', authenticateToken, loadFeatures, requireFeature('transactions.analytics'), enforceRetention('date_from','date_to'), async (req: ReqWithUser, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
  const params: unknown[] = [];
    if (date_from && date_to) {
      // Cast created_at to date for reliable filtering
      whereClause = `WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?`;
      params.push(date_from, date_to);
    }
    if (shop_id) {
      whereClause += params.length ? ' AND shop_id = ?' : ' WHERE shop_id = ?';
      params.push(shop_id);
    }
    console.log('[analytics] whereClause:', whereClause);
    console.log('[analytics] params:', params);
    // Get total sales and commission per day
    const [dailyResults] = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
  SUM(total_amount) as total_sales,
  SUM(commission_amount) as total_commission
      FROM kisaan_transactions
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `, { replacements: params });
    console.log('[analytics] dailyResults:', dailyResults);
    // Get overall aggregates
    const [aggResults] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_transactions,
  SUM(total_amount) as total_sales,
  SUM(commission_amount) as total_commission,
        SUM(farmer_earning) as total_farmer_earnings
      FROM kisaan_transactions
      ${whereClause}
    `, { replacements: params });
    // Calculate status_summary for chart: total sales (paid), pending to farmer, pending from buyer
    const [totalSalesResult] = await sequelize.query(`
  SELECT COALESCE(SUM(total_amount),0) as total_sales FROM kisaan_transactions ${whereClause}
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

  // 3. Pending payments from buyer (sum of total_amount - paid by buyer)
    const [pendingFromBuyerResult] = await sequelize.query(`
  SELECT COALESCE(SUM(t.total_amount - COALESCE(p.paid,0)),0) as pending_from_buyer
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
    success(res, {
      ...((Array.isArray(aggResults) ? aggResults[0] : aggResults) || {}),
      total_deficit,
      daily: dailyResults || [],
      status_summary
    });
  } catch (error) {
  const stack = typeof error === 'object' && error && 'stack' in error ? (error as { stack?: string }).stack : String(error);
  failureCode(res, 500, ErrorCodes.ANALYTICS_FAILURE, { stack }, 'Failed to fetch transaction analytics');
  }
});

// Specific routes must come before parameterized routes
router.get('/shop/:shopId/list', transactionController.getTransactionsByShop.bind(transactionController));
router.get('/farmer/:farmerId/list', authenticateToken, loadFeatures, requireFeature('transactions.list'), enforceRetention('from_date','to_date'), async (req: ReqWithUser, res) => {
  try {
    const { farmerId } = req.params;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sequelize } = require('../models/index');
    const [results] = await sequelize.query(
      'SELECT * FROM kisaan_transactions WHERE farmer_id = :farmerId ORDER BY created_at DESC',
      { replacements: { farmerId } }
    );
    success(res, results);
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : String(error);
    failureCode(res, 500, ErrorCodes.FARMER_TXN_LIST_FAILURE, { error: message });
  }
});
router.get('/buyer/:buyerId/list', authenticateToken, loadFeatures, requireFeature('transactions.list'), enforceRetention('from_date','to_date'), async (req: ReqWithUser, res) => {
  try {
    const { buyerId } = req.params;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sequelize } = require('../models/index');
    const [results] = await sequelize.query(
      'SELECT * FROM kisaan_transactions WHERE buyer_id = :buyerId ORDER BY created_at DESC',
      { replacements: { buyerId } }
    );
    success(res, results);
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : String(error);
    failureCode(res, 500, ErrorCodes.BUYER_TXN_LIST_FAILURE, { error: message });
  }
});

router.get('/:id', transactionController.getTransactionById.bind(transactionController));
// Confirm commission (support POST and PUT for compatibility)
router.post('/:id/confirm-commission', authenticateToken, transactionController.confirmCommission.bind(transactionController));
router.put('/:id/confirm-commission', authenticateToken, transactionController.confirmCommission.bind(transactionController));
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sequelize } = require('../models/index');

    // Whitelist allowed updatable columns
    const ALLOWED = ['quantity','unit_price','status','notes'];
  const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(patch)) {
      if (ALLOWED.includes(key)) filtered[key] = patch[key];
    }
    if (Object.keys(filtered).length === 0) {
      return failureCode(res, 400, ErrorCodes.TRANSACTION_NO_FIELDS_TO_UPDATE, undefined, 'No valid fields to update');
    }

    // If quantity or unit_price changed, recompute dependent financial fields
    if ('quantity' in filtered || 'unit_price' in filtered) {
      const [existingRows] = await sequelize.query(
        'SELECT quantity, unit_price, commission_rate FROM kisaan_transactions WHERE id = :id',
        { replacements: { id } }
      );
      const base = Array.isArray(existingRows) ? existingRows[0] : existingRows;
      if (!base) {
        return failureCode(res, 404, ErrorCodes.NOT_FOUND, undefined, 'Transaction not found');
      }
      const quantity = Number(filtered.quantity ?? base.quantity);
      const unit_price = Number(filtered.unit_price ?? base.unit_price);
      if (isNaN(quantity) || quantity <= 0 || isNaN(unit_price) || unit_price <= 0) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, undefined, 'Valid quantity and unit_price required');
      }
      const commissionRate = Number(base.commission_rate || 0);
      const totalAmount = quantity * unit_price;
      const commissionAmount = (totalAmount * commissionRate) / 100;
      const farmerEarning = totalAmount - commissionAmount;
      filtered.quantity = quantity;
      filtered.unit_price = unit_price;
  filtered.total_amount = totalAmount;
  filtered.commission_amount = commissionAmount;
      filtered.farmer_earning = farmerEarning;
    }

    const setClause = Object.keys(filtered)
      .map(key => `${key} = :${key}`)
      .join(', ');

    const [results] = await sequelize.query(
      `UPDATE kisaan_transactions SET ${setClause}, updated_at = NOW() WHERE id = :id RETURNING *`,
      { replacements: { ...filtered, id } }
    );

    success(res, Array.isArray(results) ? results[0] : results, { message: 'Transaction updated successfully' });
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : String(error);
    failureCode(res, 500, ErrorCodes.TRANSACTION_UPDATE_FAILED, { error: message }, 'Failed to update transaction');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sequelize } = require('../models/index');
    
    const [results] = await sequelize.query(
      'DELETE FROM kisaan_transactions WHERE id = :id RETURNING *',
      { replacements: { id } }
    );
    
    if (!results || (Array.isArray(results) && results.length === 0)) {
  return failureCode(res, 404, ErrorCodes.NOT_FOUND, undefined, 'Transaction not found');
    }
    success(res, { id }, { message: 'Transaction deleted successfully' });
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : String(error);
    failureCode(res, 500, ErrorCodes.TRANSACTION_DELETE_FAILED, { error: message }, 'Failed to delete transaction');
  }
});

router.get('/shop/:shopId', transactionController.getTransactionsByShop.bind(transactionController));
router.get('/shop/:shopId/earnings', transactionController.getShopEarnings.bind(transactionController));

// Farmer and buyer reporting endpoints
router.get('/farmer/:farmerId/earnings', transactionController.getFarmerEarnings.bind(transactionController));
router.get('/farmers/:farmerId/payments', paymentController.getPaymentsToFarmer.bind(paymentController));
router.get('/buyers/:buyerId/payments', paymentController.getPaymentsByBuyer.bind(paymentController));
router.get('/buyers/:buyerId/purchases', transactionController.getPurchasesByBuyer.bind(transactionController));

// Enhanced transaction routes with backdated support
import { requireRole } from '../middlewares/auth';
import { z } from 'zod';

// Backdated transaction schema
const BackdatedTransactionSchema = CreateTransactionSchema.safeExtend({
  transaction_date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed <= new Date();
  }, { message: "Transaction date must be valid and not in the future" })
});

const BackdatedPaymentSchema = z.object({
  payments: z.array(z.object({
    payer_type: z.enum(['BUYER', 'SHOP']),
    payee_type: z.enum(['SHOP', 'FARMER']),
    amount: z.number().positive(),
    method: z.enum(['CASH', 'BANK', 'UPI', 'OTHER']).optional(),
    payment_date: z.string().refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    }, { message: "Payment date must be valid and not in the future" }),
    notes: z.string().optional()
  }))
});

// Backdated transaction routes (owner only)
router.post('/backdated', 
  authenticateToken, 
  requireRole(['owner']), 
  validateSchema(BackdatedTransactionSchema), 
  transactionController.createBackdatedTransaction.bind(transactionController)
);

router.post('/:id/payments/backdated', 
  authenticateToken, 
  requireRole(['owner']), 
  validateSchema(BackdatedPaymentSchema), 
  transactionController.addBackdatedPayments.bind(transactionController)
);

// Settlement routes
router.get('/:id/settlement', authenticateToken, transactionController.getTransactionSettlement.bind(transactionController));
router.post('/:id/offset-expense', authenticateToken, transactionController.offsetExpenseAgainstTransaction.bind(transactionController));

// Payment routes
router.post('/payments', validateSchema(CreatePaymentSchema), paymentController.createPayment.bind(paymentController));
router.put('/payments/:id/status', validateSchema(UpdatePaymentStatusSchema), paymentController.updatePaymentStatus.bind(paymentController));
router.get('/payments/transaction/:transactionId', paymentController.getPaymentsByTransaction.bind(paymentController));
router.get('/payments/outstanding', paymentController.getOutstandingPayments.bind(paymentController));

export { router as transactionRoutes };