import express from 'express';
import * as creditAdvanceController from '../controllers/creditAdvanceController';

const router = express.Router();

// GET /api/credits - List all credits
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credits'
    });
  }
});

// POST /api/credits - Create a new credit
router.post('/', async (req, res) => {
  try {
    const { user_id, amount, type } = req.body;
    
    if (!user_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'user_id and amount are required'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: Date.now(),
        user_id,
        amount,
        type: type || 'advance',
        status: 'active',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create credit'
    });
  }
});

router.post('/issue', creditAdvanceController.issueCredit);
router.post('/repay', creditAdvanceController.repayCredit);

export { router as creditAdvanceRoutes };
