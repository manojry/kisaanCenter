import { Request, Response } from 'express';
import { getSettlements, getSettlementSummary, settleAmount, createSettlement } from '../services/settlementService';
import { success, failureCode } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';
import { parseId } from '../shared/utils/parse';

// Standardized settlement controller using shared responders & parseId

export class SettlementController {
  async getSettlementsController(req: Request, res: Response) {
    try {
      const { shop_id, user_id, user_type, status } = req.query;
      if (!shop_id || typeof shop_id !== 'string') {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'shop_id' }, 'shop_id is required');
      }

      const shopId = parseId(shop_id, 'shop id');
      const settlements = await getSettlements({
        shop_id: String(shopId),
        user_id: user_id as string,
        user_type: user_type as string,
        status: status as string
      });
      return success(res, settlements, { message: 'Settlements retrieved', meta: { count: settlements.length } });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'settlement:list failed');
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        const errObj = error as { status?: number; message?: string };
        return failureCode(res, errObj.status ?? 500, ErrorCodes.GET_SETTLEMENTS_FAILED, undefined, errObj.message ?? 'Failed to fetch settlements');
      }
      const message = typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : 'Failed to fetch settlements';
      return failureCode(res, 500, ErrorCodes.GET_SETTLEMENTS_FAILED, undefined, message);
    }
  }

  async getSettlementSummaryController(req: Request, res: Response) {
    try {
      const { shop_id } = req.query;
      if (!shop_id || typeof shop_id !== 'string') {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'shop_id' }, 'shop_id is required');
      }
      const shopId = parseId(shop_id, 'shop id');
      const summary = await getSettlementSummary(String(shopId));
      return success(res, summary, { message: 'Settlement summary retrieved' });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'settlement:summary failed');
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        const errObj = error as { status?: number; message?: string };
        return failureCode(res, errObj.status ?? 500, ErrorCodes.GET_SETTLEMENT_SUMMARY_FAILED, undefined, errObj.message ?? 'Failed to fetch settlement summary');
      }
      const message = typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : 'Failed to fetch settlement summary';
      return failureCode(res, 500, ErrorCodes.GET_SETTLEMENT_SUMMARY_FAILED, undefined, message);
    }
  }

  async settleAmountController(req: Request, res: Response) {
    try {
      const { settlement_id } = req.params;
      const { amount } = req.body;
      const settlementId = parseId(settlement_id, 'settlement id');
      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'amount' }, 'Valid amount is required');
      }
      const settlement = await settleAmount(settlementId, parsedAmount);
      return success(res, settlement, { message: 'Settlement amount applied' });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'settlement:settle failed');
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        const errObj = error as { status?: number; message?: string };
        return failureCode(res, errObj.status ?? 500, ErrorCodes.SETTLE_AMOUNT_FAILED, undefined, errObj.message ?? 'Failed to settle amount');
      }
      const message = typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : 'Failed to settle amount';
      return failureCode(res, 500, ErrorCodes.SETTLE_AMOUNT_FAILED, undefined, message);
    }
  }

  async createExpenseController(req: Request, res: Response) {
    try {
      const { shop_id, amount, description, owner_id } = req.body;
      if (!shop_id || !amount || !description) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { required: ['shop_id', 'amount', 'description'] }, 'shop_id, amount, and description are required');
      }
      const shopId = parseId(String(shop_id), 'shop id');
      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'amount' }, 'Valid amount is required');
      }
      // Use owner_id if provided, else fallback to shop owner lookup (could be improved)
      let expenseUserId = owner_id;
      if (!expenseUserId) {
        // TODO: Lookup shop owner from DB if not provided
        expenseUserId = null;
      }
      if (!expenseUserId) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'owner_id' }, 'owner_id (shop owner) is required for expense association');
      }
      const expense = await createSettlement({
        shop_id: shopId,
        user_id: String(expenseUserId),
        user_type: 'farmer', // Using farmer as default for shop expenses
        amount: parsedAmount,
        type: 'expense',
        description
      });
      return success(res, expense, { message: 'Expense created successfully' });
    } catch (error: unknown) {
      req.log?.error({ err: error }, 'settlement:expense create failed');
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        const errObj = error as { status?: number; message?: string };
        return failureCode(res, errObj.status ?? 500, ErrorCodes.CREATE_EXPENSE_FAILED, undefined, errObj.message ?? 'Failed to create expense');
      }
      const message = typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : 'Failed to create expense';
      return failureCode(res, 500, ErrorCodes.CREATE_EXPENSE_FAILED, undefined, message);
    }
  }
}