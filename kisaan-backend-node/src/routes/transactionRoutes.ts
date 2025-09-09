import express from 'express';
import { TransactionController } from '../controllers/transactionController';
import { PaymentController } from '../controllers/paymentController';
import { CreateTransactionSchema, CreatePaymentSchema, UpdatePaymentStatusSchema } from '../schemas/transaction';
import { authenticateToken } from '../middlewares/auth';
import { validateSchema } from '../middlewares/validation';

const router = express.Router();
const transactionController = new TransactionController();
const paymentController = new PaymentController();

// Apply authentication to all routes
router.use(authenticateToken);

// Transaction routes
router.post('/', validateSchema(CreateTransactionSchema), transactionController.createTransaction.bind(transactionController));
router.get('/:id', transactionController.getTransactionById.bind(transactionController));
router.get('/shop/:shopId', transactionController.getTransactionsByShop.bind(transactionController));
router.get('/shop/:shopId/earnings', transactionController.getShopEarnings.bind(transactionController));

// Farmer and buyer reporting endpoints
router.get('/farmer/:farmerId/earnings', transactionController.getFarmerEarnings.bind(transactionController));
router.get('/farmers/:farmerId/payments', paymentController.getPaymentsToFarmer.bind(paymentController));
router.get('/buyers/:buyerId/payments', paymentController.getPaymentsByBuyer.bind(paymentController));
router.get('/buyers/:buyerId/purchases', transactionController.getPurchasesByBuyer.bind(transactionController));

// Payment routes
router.post('/payments', validateSchema(CreatePaymentSchema), paymentController.createPayment.bind(paymentController));
router.put('/payments/:id/status', validateSchema(UpdatePaymentStatusSchema), paymentController.updatePaymentStatus.bind(paymentController));
router.get('/payments/transaction/:transactionId', paymentController.getPaymentsByTransaction.bind(paymentController));
router.get('/payments/outstanding', paymentController.getOutstandingPayments.bind(paymentController));

export { router as transactionRoutes };