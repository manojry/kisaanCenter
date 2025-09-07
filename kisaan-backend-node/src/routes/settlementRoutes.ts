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

export default router;