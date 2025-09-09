import express from 'express';
import { CommissionController } from '../controllers/commissionController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();
const commissionController = new CommissionController();

router.use(authenticateToken);

router.post('/', commissionController.createCommission.bind(commissionController));
router.get('/shop/:shopId', commissionController.getCommissionsByShop.bind(commissionController));
router.put('/:id', commissionController.updateCommission.bind(commissionController));

export { router as commissionRoutes };