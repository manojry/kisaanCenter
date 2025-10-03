
import express from 'express';
import { CreditAdvanceController } from '../controllers';

const router = express.Router();



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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
