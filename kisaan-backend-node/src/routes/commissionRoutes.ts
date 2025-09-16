import express from 'express';
import { CommissionController } from '../controllers';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();
const commissionController = new CommissionController();

// router.use(authenticateToken);

router.post('/', commissionController.createCommission.bind(commissionController));
router.get('/', commissionController.getAllCommissions.bind(commissionController));
router.get('/shop/:shopId', commissionController.getCommissionsByShop.bind(commissionController));
router.put('/:id', commissionController.updateCommission.bind(commissionController));

// POST /api/commissions/calculate - Calculate commission for an amount
router.post('/calculate', async (req, res) => {
  try {
    const { shop_id, amount } = req.body;
    
    if (!shop_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'shop_id and amount are required'
      });
    }

    // Mock calculation - 15% commission
    const commission_amount = Number(amount) * 0.15;
    
    res.json({
      success: true,
      data: {
        shop_id,
        amount: Number(amount),
        commission_rate: 15,
        commission_amount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate commission'
    });
  }
});

export { router as commissionRoutes };