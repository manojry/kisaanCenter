import express from 'express';
import { PaymentController } from '../controllers/paymentController';
import { CreatePaymentSchema, UpdatePaymentStatusSchema } from '../schemas/payment';
import { authenticateToken } from '../middlewares/auth';
import { validateSchema } from '../middlewares/validation';

const router = express.Router();
const paymentController = new PaymentController();

// Apply authentication to all routes
// router.use(authenticateToken);

// Payment routes
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});
router.post('/', validateSchema(CreatePaymentSchema), paymentController.createPayment.bind(paymentController));
router.put('/:id/status', validateSchema(UpdatePaymentStatusSchema), paymentController.updatePaymentStatus.bind(paymentController));
router.get('/transaction/:transactionId', paymentController.getPaymentsByTransaction.bind(paymentController));
router.get('/outstanding', paymentController.getOutstandingPayments.bind(paymentController));

// Farmer and buyer reporting endpoints (for direct access via /payments)
router.get('/farmers/:farmerId', paymentController.getPaymentsToFarmer.bind(paymentController));
router.get('/buyers/:buyerId', paymentController.getPaymentsByBuyer.bind(paymentController));

export { router as paymentRoutes };