import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { CreatePaymentDTO, UpdatePaymentStatusDTO } from '../dtos';
import { success, created, failureCode } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';
import { z } from 'zod';
import { CreatePaymentSchema, UpdatePaymentStatusSchema } from '../schemas/payment';
import { PARTY_TYPE } from '../shared/partyTypes';

// Schemas for route params & query validation (kept local to controller)
const IdParamSchema = z.object({ id: z.string().regex(/^[0-9]+$/).transform(Number) });
const FarmerIdParamSchema = z.object({ farmerId: z.string().regex(/^[0-9]+$/).transform(Number) });
const BuyerIdParamSchema = z.object({ buyerId: z.string().regex(/^[0-9]+$/).transform(Number) });
const TransactionIdParamSchema = z.object({ transactionId: z.string().regex(/^[0-9]+$/).transform(Number) });
const OptionalShopQuerySchema = z.object({ shopId: z.string().regex(/^[0-9]+$/).transform(Number).optional() });
const DateRangeQuerySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional()
})
  .refine(q => !q.startDate && !q.endDate || (q.startDate !== undefined && q.endDate !== undefined), {
    message: 'Both startDate and endDate must be provided together'
  })
  .refine(q => {
    if (q.startDate && q.endDate) {
      return new Date(q.startDate) <= new Date(q.endDate);
    }
    return true;
  }, { message: 'startDate must be before or equal to endDate' });

export class PaymentController {
  private paymentService = new PaymentService();
  /**
   * GET /farmers/:farmerId/payments - All payments to a farmer, with optional date filtering and aggregation
   */
  async getPaymentsToFarmer(req: Request, res: Response) {
    try {
      const { farmerId } = FarmerIdParamSchema.parse(req.params);
      const { startDate, endDate } = DateRangeQuerySchema.parse(req.query);
      
      // Get farmer's shop_id for expense filtering
      const { User } = await import('../models');
      const farmer = await User.findByPk(farmerId);
      
      const options: Record<string, unknown> = {};
      if (startDate && endDate) {
        options.startDate = new Date(startDate);
        options.endDate = new Date(endDate);
      }
      if (farmer?.shop_id) {
        options.shopId = farmer.shop_id;
      }
      
      const result = await this.paymentService.getPaymentsToFarmer(farmerId, options);
      success(res, result);  } catch (error) {
      if (error instanceof z.ZodError) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { issues: error.issues }, 'Validation failed');
      }

      failureCode(res, 500, ErrorCodes.GET_PAYMENTS_FARMER_FAILED, { error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to fetch payments to farmer');
    }
  }

  /**
   * GET /buyers/:buyerId/payments - All payments by a buyer, with optional date filtering and aggregation
   */
  async getPaymentsByBuyer(req: Request, res: Response) {
    try {
      const { buyerId } = BuyerIdParamSchema.parse(req.params);
      const { startDate, endDate } = DateRangeQuerySchema.parse(req.query);
  const options: Record<string, unknown> = {};
      if (startDate && endDate) {
        options.startDate = new Date(startDate);
        options.endDate = new Date(endDate);
      }
      const result = await this.paymentService.getPaymentsByBuyer(buyerId, options);
      success(res, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { issues: error.issues }, 'Validation failed');
      }
      failureCode(res, 500, ErrorCodes.GET_PAYMENTS_BUYER_FAILED, { error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to fetch payments by buyer');
    }
  }

  async createPayment(req: Request, res: Response) {
    try {
  (req as { log?: { info: (obj: unknown, msg: string) => void } }).log?.info({ body: req.body }, 'createPayment request');
  const reqUser = (req as { user?: { id?: number; role?: string; shop_id?: number } }).user;
  const userId = reqUser?.id || 1; // Default to superadmin for testing
      // Body should already be validated by route middleware, but parse again for defense-in-depth
      let paymentData: CreatePaymentDTO;
      try {
        paymentData = CreatePaymentSchema.parse(req.body) as CreatePaymentDTO;
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { issues: err.issues }, 'Validation failed');
        }
        throw err;
      }
      // Authorization: if a shop is paying a farmer, ensure requester is the shop owner or superadmin
      if (paymentData.payer_type === PARTY_TYPE.SHOP && paymentData.payee_type === PARTY_TYPE.FARMER) {
        // Resolve shop_id from body or transaction if available in service later; here, if shop_id in body check ownership
        const shopId = (paymentData as any).shop_id || (reqUser ? reqUser.shop_id : undefined);
        if (reqUser?.role === 'owner') {
          if (!shopId || Number(shopId) !== Number(reqUser.shop_id) && reqUser.shop_id !== undefined) {
            // If owner role but shopId doesn't match their shop, reject
            return failureCode(res, 403, ErrorCodes.FORBIDDEN, undefined, 'Only the shop owner can make payments on behalf of the shop');
          }
        }
        // If role is buyer/staff, they'll be rejected in deeper business logic; superadmin allowed
      }

      const payment = await this.paymentService.createPayment(paymentData, userId);
      created(res, payment, { message: 'Payment recorded successfully' });
    } catch (error) {
      failureCode(res, 500, ErrorCodes.CREATE_PAYMENT_FAILED, { error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to create payment');
    }
  }

  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = IdParamSchema.parse({ id: req.params.id });
  const userId = (req as { user?: { id?: number } }).user?.id || 1; // Default to superadmin for testing
      let rawData: unknown;
      try {
        rawData = UpdatePaymentStatusSchema.parse(req.body);
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { issues: err.issues }, 'Validation failed');
        }
        throw err;
      }

      const raw = rawData as UpdatePaymentStatusDTO;
      const updateData: UpdatePaymentStatusDTO = {
        ...raw,
        payment_date: raw.payment_date && typeof raw.payment_date === 'string' ? new Date(raw.payment_date) : raw.payment_date
      };

      let payment;
      try {
        payment = await this.paymentService.updatePaymentStatus(Number(id), updateData, userId);
      } catch (err) {
        return failureCode(res, 500, ErrorCodes.UPDATE_PAYMENT_STATUS_FAILED, { error: err instanceof Error ? err.message : 'Unknown error' }, 'Failed to update payment status');
      }

      if (!payment) {
        return failureCode(res, 404, ErrorCodes.PAYMENT_NOT_FOUND, undefined, 'Payment not found');
      }

      success(res, payment, { message: 'Payment status updated successfully' });
    } catch (error) {
      failureCode(res, 500, ErrorCodes.UPDATE_PAYMENT_STATUS_FAILED, { error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to update payment status');
    }
  }

  async getPaymentsByTransaction(req: Request, res: Response) {
    try {
      const { transactionId } = TransactionIdParamSchema.parse(req.params);
      const payments = await this.paymentService.getPaymentsByTransaction(transactionId);

      success(res, payments);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { issues: error.issues }, 'Validation failed');
      }
      failureCode(res, 500, ErrorCodes.GET_PAYMENTS_BY_TXN_FAILED, { error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to fetch payments');
    }
  }

  async getOutstandingPayments(req: Request, res: Response) {
    try {
      const { shopId } = OptionalShopQuerySchema.parse(req.query);
      const payments = await this.paymentService.getOutstandingPayments(shopId);

      success(res, payments);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { issues: error.issues }, 'Validation failed');
      }
      failureCode(res, 500, ErrorCodes.GET_OUTSTANDING_PAYMENTS_FAILED, { error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to fetch outstanding payments');
    }
  }

  // Bulk create payments - thin controller that delegates to service
  async createBulkPayments(req: Request, res: Response) {
    try {
      // Body validation already applied by route middleware
      const bulk = req.body as import('../dtos/PaymentDTO').BulkPaymentDTO;
      const userId = (req as { user?: { id?: number } }).user?.id || 1;
      const results = await this.paymentService.createBulkPayments(bulk, userId);
      created(res, results, { message: 'Bulk payments processed' });
    } catch (err) {
      failureCode(res, 500, ErrorCodes.CREATE_PAYMENT_FAILED, { error: err instanceof Error ? err.message : 'Unknown error' }, 'Failed to create bulk payments');
    }
  }
}
