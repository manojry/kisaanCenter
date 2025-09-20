import { Router } from 'express';
import { SettlementController } from '../controllers/settlementController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const settlementController = new SettlementController();

// Utility: expand YYYY-MM-DD to full day ISO string
function expandToFullDay(dateStr: string, isEnd: boolean): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return isEnd
      ? `${dateStr}T23:59:59.999Z`
      : `${dateStr}T00:00:00.000Z`;
  }
  return dateStr;
}

// POST /api/settlements/repay-fifo - Apply repayment FIFO for a user/shop
router.post('/repay-fifo', authenticateToken, async (req, res) => {
  try {
    const { shop_id, user_id, amount } = req.body;
    if (!shop_id || !user_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'shop_id, user_id, and valid amount are required' });
    }
    const { applyRepaymentFIFO } = require('../services/settlementService');
    const result = await applyRepaymentFIFO(parseInt(shop_id), parseInt(user_id), parseFloat(amount));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settlements?shop_id=...&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { shop_id, user_id, user_type, status, from_date, to_date } = req.query;
    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required' });
    }
    // Expand date strings to ISO
    const expandedFromDate = from_date ? expandToFullDay(from_date as string, false) : undefined;
    const expandedToDate = to_date ? expandToFullDay(to_date as string, true) : undefined;
    // Call service directly
    const { getSettlements } = require('../services/settlementService');
    const settlements = await getSettlements({
      shop_id: shop_id as string,
      user_id: user_id as string,
      user_type: user_type as string,
      status: status as string,
      from_date: expandedFromDate,
      to_date: expandedToDate
    });
    res.json({ success: true, data: settlements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', authenticateToken, settlementController.getSettlementSummaryController.bind(settlementController));
router.post('/settle/:settlement_id', authenticateToken, settlementController.settleAmountController.bind(settlementController));
router.post('/expense', authenticateToken, settlementController.createExpenseController.bind(settlementController));

// POST /api/settlements - Create a new settlement
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { shop_id, amount, type } = req.body;
    res.status(201).json({
      success: true,
      data: {
        id: Date.now(),
        shop_id,
        amount,
        type: type || 'commission',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create settlement'
    });
  }
});

// GET /api/settlements/:id - Get settlement by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      data: {
        id: Number(id),
        shop_id: 1,
        amount: 150.00,
        type: 'commission',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settlement'
    });
  }
});

// PATCH /api/settlements/:id/status - Update settlement status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    res.json({
      success: true,
      data: {
        id: Number(id),
        status,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update settlement status'
    });
  }
});

export default router;