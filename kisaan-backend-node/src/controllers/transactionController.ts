import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { CreateTransactionDTO } from '../dtos';
import { success, created as createdResp, failureCode } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';
import { buildPaginationMeta } from '../middleware/pagination';
import { parseId, parseOptionalId } from '../shared/utils/parse';

export class TransactionController {
  /**
   * GET /buyers/:buyerId/purchases - All transactions for a buyer, with optional date filtering and aggregation
   */
  async getPurchasesByBuyer(req: Request, res: Response) {
    try {
      const buyerId = parseId(req.params.buyerId, 'buyer');
      const { startDate, endDate } = req.query;
  const filters: Record<string, unknown> = { buyerId };
      if (startDate && endDate) {
        filters.startDate = new Date(startDate as string);
        filters.endDate = new Date(endDate as string);
      }
  const pagination = req.pagination;
  const transactions = await this.transactionService.getTransactionsByBuyer(buyerId, filters);
  const totalPurchases = transactions.length;
  const totalSpent = transactions.reduce((sum, t) => {
    if (typeof t === 'object' && t !== null && 'total_amount' in t) {
      return sum + Number((t as { total_amount?: unknown }).total_amount || 0);
    }
    return sum;
  }, 0);
  const sliced = pagination ? transactions.slice(pagination.offset, pagination.offset + pagination.limit) : transactions;
  const meta = pagination ? { ...buildPaginationMeta(transactions.length, pagination), totalPurchases, totalSpent } : { totalPurchases, totalSpent };
  return success(res, { totalPurchases, totalSpent, transactions: sliced }, { message: 'Buyer purchases retrieved', meta });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'transactions:buyerPurchases failed');
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
      const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : undefined;
      return failureCode(res, statusCode || 500, ErrorCodes.BUYER_TXN_LIST_FAILURE, undefined, message || 'Failed to fetch purchases by buyer');
    }
  }
  private transactionService = new TransactionService();

  async createTransaction(req: Request, res: Response) {
    try {
      req.log?.info('transaction:create attempt');
  const user = (req as Request & { user?: { id?: number; role?: string } }).user;
  const userId = user?.id || 1;
  const requestingUser = user ? { id: user.id, role: user.role } : { id: userId, role: 'superadmin' };
      
      // Import PaymentService for payment creation
      const { PaymentService } = await import('../services/paymentService');
      const paymentService = new PaymentService();

      // Extract transaction data (remove payments array and calculated fields)
      const { payments, total_sale_value, shop_commission, farmer_earning, ...transactionData } = req.body;
      
      const serviceData = {
        shop_id: transactionData.shop_id,
        farmer_id: transactionData.farmer_id,
        buyer_id: transactionData.buyer_id,
        product_id: transactionData.product_id ?? null,
        category_id: transactionData.category_id,
        product_name: transactionData.product_name,
        quantity: transactionData.quantity,
        unit_price: transactionData.unit_price,
        commission_rate: transactionData.commission_rate,
        transaction_date: new Date(),
        notes: transactionData.notes
      };

      // Create the transaction
  const transaction = await this.transactionService.createTransaction(serviceData, requestingUser);
      
      // Create payments if provided
      let createdPayments = [];
      if (payments && Array.isArray(payments)) {
        for (const payment of payments) {
          const paymentData = {
            transaction_id: transaction.id,
            payer_type: payment.payer_type,
            payee_type: payment.payee_type,
            amount: payment.amount,
            method: payment.method,
            status: payment.status || 'PAID',
            payment_date: payment.payment_date || new Date(),
            notes: payment.notes
          };
          const createdPayment = await paymentService.createPayment(paymentData, userId);
          createdPayments.push(createdPayment);
        }
      }

      // Return transaction with payments
      const response = {
        ...transaction,
        payments: createdPayments
      };

      return createdResp(res, response, { message: 'Transaction created successfully' });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'transaction:create failed');
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
      const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : undefined;
      return failureCode(res, statusCode || 500, ErrorCodes.TRANSACTION_CREATE_FAILED, undefined, message || 'Failed to create transaction');
    }
  }

  async getTransactionById(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id, 'transaction');
      const transaction = await this.transactionService.getTransactionById(id);
      if (!transaction) {
  return failureCode(res, 404, ErrorCodes.NOT_FOUND, undefined, 'Transaction not found');
      }
      if (typeof transaction === 'object' && transaction !== null && !('payments' in transaction)) {
        (transaction as Record<string, unknown>).payments = [];
      }
      return success(res, transaction, { message: 'Transaction retrieved successfully' });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'transaction:get failed');
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
      const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : undefined;
      return failureCode(res, statusCode || 500, ErrorCodes.NOT_FOUND, undefined, message || 'Failed to fetch transaction');
    }
  }

  async getTransactionsByShop(req: Request, res: Response) {
    try {
      const shopId = parseId(req.params.shopId, 'shop');
      const { startDate, endDate, farmerId, buyerId } = req.query;
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        farmerId: farmerId ? Number(farmerId) : undefined,
        buyerId: buyerId ? Number(buyerId) : undefined
      };
  const pagination = req.pagination;
  const transactions = await this.transactionService.getTransactionsByShop(shopId, filters);
  const sliced = pagination ? transactions.slice(pagination.offset, pagination.offset + pagination.limit) : transactions;
  const meta = pagination ? { ...buildPaginationMeta(transactions.length, pagination) } : { count: transactions.length };
  return success(res, sliced, { message: 'Shop transactions retrieved', meta });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'transactions:byShop failed');
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
      const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : undefined;
      return failureCode(res, statusCode || 500, ErrorCodes.FARMER_TXN_LIST_FAILURE, undefined, message || 'Failed to fetch transactions');
    }
  }

  async getShopEarnings(req: Request, res: Response) {
    try {
      const shopId = parseId(req.params.shopId, 'shop');
      const { startDate, endDate } = req.query;
      const period = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      const earnings = await this.transactionService.getShopEarnings(shopId, period);
      return success(res, earnings, { message: 'Shop earnings retrieved' });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'transactions:shopEarnings failed');
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
      const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : undefined;
      return failureCode(res, statusCode || 500, ErrorCodes.ANALYTICS_FAILURE, undefined, message || 'Failed to fetch shop earnings');
    }
  }

  async getFarmerEarnings(req: Request, res: Response) {
    try {
      const farmerId = parseId(req.params.farmerId, 'farmer');
      const { shopId, startDate, endDate } = req.query;
      const period = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      const optionalShopId = parseOptionalId(shopId, 'shop');
      const earnings = await this.transactionService.getFarmerEarnings(farmerId, optionalShopId, period);
      return success(res, earnings, { message: 'Farmer earnings retrieved' });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'transactions:farmerEarnings failed');
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
      const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : undefined;
      return failureCode(res, statusCode || 500, ErrorCodes.ANALYTICS_FAILURE, undefined, message || 'Failed to fetch farmer earnings');
    }
  }
}