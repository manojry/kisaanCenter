import { ExpenseRepository } from '../repositories/ExpenseRepository';
import Expense, { ExpenseStatus } from '../models/expense';
import ExpenseSettlement from '../models/expenseSettlement';
import { User } from '../models/user';
import { TransactionLedger } from '../models/transactionLedger';
import sequelize from '../config/database';

export interface CreateExpenseData {
  shop_id: number;
  user_id: number;
  amount: number;
  type: string;
  description: string;
  transaction_id?: number | null;
}

export interface GetExpensesFilters {
  shop_id: string;
  user_id?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}

export interface ExpenseUserSummary {
  user_id: number;
  username: string;
  role: string;
  balance: number;
  total_amount: number;
  pending_count: number;
}

// Create a new expense
export const createExpense = async (data: CreateExpenseData, options?: { tx?: import('sequelize').Transaction }) => {
  const expenseRepo = new ExpenseRepository();
  const expense = await expenseRepo.create({
    shop_id: data.shop_id,
    user_id: data.user_id,
    amount: data.amount,
    type: data.type,
    description: data.description,
    transaction_id: data.transaction_id || null,
    status: ExpenseStatus.Pending
  } as any, options);

  console.log('[EXPENSE] Expense created', {
    expenseId: (expense as any)?.id,
    type: data.type,
    userId: data.user_id,
    amount: data.amount,
    status: 'pending'
  });

  // ❌ DO NOT UPDATE USER BALANCE HERE! ❌
  // Expenses are tracked in the Expense table, and transactionService.updateUserBalances()
  // already subtracts unsettled expenses from farmer balance (line 1627).
  // Updating balance here would DOUBLE-COUNT expenses!
  //
  // Balance calculation logic (in transactionService.ts):
  // Farmer Balance = Unpaid Transaction Earnings - Unsettled Expenses
  //
  // When expense is created, it's added to Expense table as "pending"
  // When transaction is created/updated, updateUserBalances() fetches all expenses
  // and subtracts unsettled amounts automatically.

  // Adjust existing payments for retroactive expense
  try {
    const { PaymentService } = await import('./paymentService');
    const paymentService = new PaymentService();

    const adjustmentResult = await paymentService.adjustPaymentsForExpense(
      data.shop_id,
      data.user_id,
      data.amount,
      (expense as any)?.id,
      options
    );

    if (adjustmentResult.totalAdjusted > 0) {
      console.log('[EXPENSE] Payments adjusted for retroactive expense', {
        expenseId: (expense as any)?.id,
        totalAdjusted: adjustmentResult.totalAdjusted,
        adjustedPaymentsCount: adjustmentResult.adjustedPayments.length
      });
    }
  } catch (error) {
    console.error('[EXPENSE] Failed to adjust payments for expense', {
      expenseId: (expense as any)?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't fail expense creation if payment adjustment fails
  }

  // Record expense in transaction ledger
  await TransactionLedger.create({
    user_id: data.user_id,
    transaction_id: null,
    delta_amount: data.amount,
    role: 'farmer',
    reason_code: 'EXPENSE',
    created_at: new Date()
  }, { transaction: options?.tx });

  // Update user balance
  const { User } = await import('../models/user');
  await User.update(
    { balance: sequelize.literal(`balance + ${data.amount}`) },
    { where: { id: data.user_id }, transaction: options?.tx }
  );

  return expense;
};

// Get expenses with filters - NOW INCLUDES settled/unsettled amounts
export const getExpenses = async (filters: GetExpensesFilters) => {
  const repo = new ExpenseRepository();
  const shopId = parseInt(filters.shop_id);
  const all = await repo.findAllByShop(shopId);
  let result = all;

  if (filters.user_id) {
    const uid = parseInt(filters.user_id);
    result = result.filter((e: any) => e.user_id === uid);
  }

  // Additional filtering by status/dates can be added here
  if (filters.status) {
    result = result.filter((e: any) => e.status === filters.status);
  }

  // Calculate settled and unsettled amounts for each expense
  const expenseDetails = await Promise.all(
    result.map(async (expense: any) => {
      const expenseAmount = Number(expense.amount || 0);
      
      // Get settlements for this expense
      const settlements = await ExpenseSettlement.findAll({
        where: { expense_id: expense.id }
      });
      const settledAmount = settlements.reduce((sum: number, s: any) => 
        sum + Number(s.amount || 0), 0);
      
      const unsettledAmount = Math.max(0, expenseAmount - settledAmount);
      
      return {
        ...expense.toJSON(),
        settled: settledAmount,
        unsettled: unsettledAmount
      };
    })
  );

  return expenseDetails;
};

// Get expense summary by shop
export const getExpenseSummary = async (shop_id: string) => {
  const repo = new ExpenseRepository();
  const expenses = await repo.findAllByShop(parseInt(shop_id));
  const users = await User.findAll({ where: { shop_id: shop_id } });
  const summary: { [userId: number]: ExpenseUserSummary } = {};

  // Get all settlements for these expenses in one query
  const expenseIds = expenses.map(e => e.id);
  const settlements = await ExpenseSettlement.findAll({
    where: { expense_id: expenseIds },
    attributes: [
      'expense_id',
      [ExpenseSettlement.sequelize!.fn('SUM', ExpenseSettlement.sequelize!.col('amount')), 'total_settled']
    ],
    group: ['expense_id'],
    raw: true
  });

  const settlementMap = new Map<number, number>();
  settlements.forEach((s: any) => {
    settlementMap.set(s.expense_id, parseFloat(s.total_settled || '0'));
  });

  for (const e of expenses) {
    const user = users.find(u => u.id === e.user_id);
    if (!user) continue;

    const expenseAmount = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
    const settledAmount = settlementMap.get(e.id) || 0;
    const pendingAmount = Math.max(0, expenseAmount - settledAmount);

    if (!summary[e.user_id]) {
      summary[e.user_id] = {
        user_id: e.user_id,
        username: user.username,
        role: user.role,
        balance: typeof user.balance === 'string' ? parseFloat(user.balance) : user.balance,
  total_amount: 0,
        pending_count: 0
      };
    }

  summary[e.user_id].total_amount += expenseAmount;
    if (pendingAmount > 0) summary[e.user_id].pending_count++;
  }

  return Object.values(summary);
};

// Mark expense as settled
export const settleExpense = async (expense_id: number) => {
  const repo = new ExpenseRepository();
  return await repo.markSettled(expense_id);
};

// Partially or fully settle an expense
export const settleExpenseAmount = async (expense_id: number, amount: number, options?: { tx?: import('sequelize').Transaction }) => {
  const repo = new ExpenseRepository();
  const e = await Expense.findByPk(expense_id);
  if (!e) throw new Error('Expense not found');

  const originalAmount = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
  if (amount >= originalAmount) {
    // Fully settle
    return await repo.markSettled(expense_id, options);
  }

  // Partial settle: reduce amount and save
  e.amount = originalAmount - amount;
  await e.save(options?.tx ? { transaction: options.tx } as any : undefined);
  return e;
};