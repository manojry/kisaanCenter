import express from 'express';
import { PaymentController } from '../controllers/paymentController';
import { CreatePaymentSchema, UpdatePaymentStatusSchema } from '../schemas/transaction';
import { authenticateToken } from '../middlewares/auth';
import { validateSchema } from '../middlewares/validation';

const router = express.Router();
const paymentController = new PaymentController();

// Apply authentication to all routes
router.use(authenticateToken);

// Payment routes
router.post('/', validateSchema(CreatePaymentSchema), paymentController.createPayment.bind(paymentController));
router.put('/:id/status', validateSchema(UpdatePaymentStatusSchema), paymentController.updatePaymentStatus.bind(paymentController));
router.get('/transaction/:transactionId', paymentController.getPaymentsByTransaction.bind(paymentController));
router.get('/outstanding', paymentController.getOutstandingPayments.bind(paymentController));

export { router as paymentRoutes };