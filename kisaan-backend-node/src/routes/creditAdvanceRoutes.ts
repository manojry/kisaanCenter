
import express from 'express';
import { CreditAdvanceController } from '../controllers';

const router = express.Router();

// Utility: expand YYYY-MM-DD to full day ISO string
function expandToFullDay(dateStr: string, isEnd: boolean): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return isEnd
      ? `${dateStr}T23:59:59.999Z`
      : `${dateStr}T00:00:00.000Z`;
  }
  return dateStr;
}

// Example usage for future: (uncomment and adapt as needed)
// router.get('/filter', async (req, res) => {
//   let { from_date, to_date } = req.query;
//   from_date = expandToFullDay(from_date, false);
//   to_date = expandToFullDay(to_date, true);
//   // ... use from_date/to_date in query ...
// });

// GET /api/credits - List all credits
router.get('/', async (req, res) => {
  try {
    const { CreditAdvance } = require('../models/creditAdvance');
    const credits = await CreditAdvance.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json({
      success: true,
      data: credits,
      meta: { count: credits.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credits'
    });
  }
});


const creditAdvanceController = new CreditAdvanceController();

// POST /api/credits - Create a new credit (if needed, implement in controller)
// router.post('/', creditAdvanceController.createCredit.bind(creditAdvanceController));

router.post('/issue', creditAdvanceController.issueCredit.bind(creditAdvanceController));
router.post('/repay', creditAdvanceController.repayCredit.bind(creditAdvanceController));

export { router as creditAdvanceRoutes };
