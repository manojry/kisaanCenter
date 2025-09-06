import express from 'express';
import * as creditAdvanceController from '../controllers/creditAdvanceController';

const router = express.Router();

router.post('/issue', creditAdvanceController.issueCredit);
router.post('/repay', creditAdvanceController.repayCredit);

export { router as creditAdvanceRoutes };
