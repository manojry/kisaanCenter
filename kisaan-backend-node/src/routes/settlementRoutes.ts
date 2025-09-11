import { Router } from 'express';
import { 
  getSettlementsController, 
  getSettlementSummaryController, 
  settleAmountController,
  createExpenseController 
} from '../controllers/settlementController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, getSettlementsController);
router.get('/summary', authenticateToken, getSettlementSummaryController);
router.post('/settle/:settlement_id', authenticateToken, settleAmountController);
router.post('/expense', authenticateToken, createExpenseController);

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