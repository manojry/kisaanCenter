import express from 'express';
import * as commissionController from '../controllers/commissionController';

const router = express.Router();

router.post('/calculate', commissionController.calculateCommission);
router.get('/summary/:shopId', commissionController.getCommissionSummary);

export { router as commissionRoutes };
