import { Router } from 'express';
import { CreditController } from '../controllers/creditController';

const router = Router();
const controller = new CreditController();

router.post('/', (req,res) => controller.apply(req,res));
router.get('/:userId', (req,res) => controller.list(req,res));

export const creditRoutes = router;
