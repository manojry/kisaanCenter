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

// Transaction routes
router.get('/', async (req, res) => {
  try {
    const { sequelize } = require('../models/index');
    const [results] = await sequelize.query('SELECT * FROM kisaan_transactions ORDER BY created_at DESC');
    res.json({
      success: true,
      data: Array.isArray(results) ? results : []
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