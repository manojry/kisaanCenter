import { Settlement, SettlementStatus, SettlementReason } from '../models/settlement';
import { User } from '../models/user';
import { Op } from 'sequelize';
import { SettlementRepository } from '../repositories/SettlementRepository';

// FIFO repayment logic: When a payment is made, settle oldest pending settlements first
export const applyRepaymentFIFO = async (shop_id: number, user_id: number, repaymentAmount: number) => {
  const repo = new SettlementRepository();
  // Fetch all pending settlements for this shop/user, oldest first
  let pendingSettlements = await repo.findAllByUser(shop_id, user_id);
  // Sort oldest first
  pendingSettlements = pendingSettlements.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let remaining = repaymentAmount;
  const updates = [];
  for (const settlement of pendingSettlements) {
    if (remaining <= 0) break;
    const originalAmount = typeof settlement.amount === 'string' ? parseFloat(settlement.amount) : settlement.amount;
    const settleAmt = Math.min(remaining, originalAmount);
    if (settleAmt === originalAmount) {
  await repo.updateStatus(settlement.id, SettlementStatus.Settled);
  settlement.settlement_date = new Date();
  await settlement.save();
      updates.push({ id: settlement.id, settled: settleAmt });
    } else {
      const newAmount = originalAmount - settleAmt;
  settlement.amount = newAmount;
  await settlement.save();
      updates.push({ id: settlement.id, partial: settleAmt });
    }
    remaining -= settleAmt;
  }
  return { updates, remaining };
};

export interface CreateSettlementInput {
  shop_id: number;
  user_id: string;
  user_type: 'farmer' | 'buyer';
  transaction_id?: number;
  amount: number;
  type: 'overpayment' | 'underpayment' | 'settlement' | 'expense' | 'payment_received' | 'payment_made';
  description: string;
}

export const createSettlement = async (data: CreateSettlementInput) => {
  let reason: SettlementReason;
  switch (data.type) {
    case 'overpayment':
      reason = SettlementReason.Overpayment;
      break;
    case 'underpayment':
      reason = SettlementReason.Underpayment;
      break;
    case 'expense':
      reason = SettlementReason.Expense;
      break;
    case 'payment_received':
    case 'payment_made':
    case 'settlement':
      reason = SettlementReason.Adjustment;
      break;
    default:
      reason = SettlementReason.Adjustment;
  }
  const repo = new SettlementRepository();
  const settlement = await repo.create({
    shop_id: data.shop_id,
    user_id: parseInt(data.user_id),
    amount: data.amount,
    reason,
    status: SettlementStatus.Pending
  });

  console.log('[SETTLEMENT] Settlement created', {
    settlementId: settlement.id,
    type: data.type,
    userId: parseInt(data.user_id),
    amount: data.amount,
    status: 'pending'
  });

  return settlement;
};

  // ...existing code...
export interface GetSettlementsFilters {
  shop_id: string;
  user_id?: string;
  user_type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}

export const getSettlements = async (filters: GetSettlementsFilters) => {
  const repo = new SettlementRepository();
  const shopId = parseInt(filters.shop_id);
  let settlements;
  if (filters.user_id) {
    settlements = await repo.findAllByUser(shopId, parseInt(filters.user_id));
  } else {
    settlements = await repo.findAllByShop(shopId);
  }
  // Additional filtering can be applied here if needed (status, date, etc.)
  return settlements;
};

/**
 * Calculate net payable amount for a farmer
 * Net Payable = Balance (from transactions) - Pending Expenses (advances)
 */
export const getFarmerNetPayable = async (shop_id: number, farmer_id: number) => {
  const farmer = await User.findByPk(farmer_id);
  const currentBalance = Number(farmer?.balance || 0);
  const repo = new SettlementRepository();
  const totalPendingExpenses = await repo.getPendingExpenses(shop_id, farmer_id);
  const netPayable = currentBalance - totalPendingExpenses;
  // If you need breakdown, fetch settlements
  const pendingExpenseSettlements = await repo.findAllByUser(shop_id, farmer_id);
  const expenses_breakdown = pendingExpenseSettlements
    .filter(exp => exp.status === SettlementStatus.Pending && exp.reason === SettlementReason.Adjustment)
    .map(exp => ({
      id: exp.id,
      amount: exp.amount,
      created_at: exp.created_at,
      description: 'Farmer advance/expense'
    }));
  return {
    farmer_id,
    current_balance: currentBalance,
    pending_expenses: totalPendingExpenses,
    net_payable: Math.max(0, netPayable),
    expenses_breakdown
  };
};

export const getSettlementSummary = async (shop_id: string) => {
  const repo = new SettlementRepository();
  const settlements = await repo.findAllByShop(parseInt(shop_id));
  type SettlementSummary = {
    user_id: string;
    user_type: string;
    username: string;
    total_balance: number;
    pending_count: number;
  };
  type Summary = {
    [key: string]: SettlementSummary;
  };
  const summary = settlements.reduce((acc: Summary, s: any) => {
    const key = `${s.user_type}_${s.user_id}`;
    if (!acc[key]) {
      acc[key] = {
        user_id: String(s.user_id),
        user_type: s.user_type,
        username: s.username || 'Unknown',
        total_balance: 0,
        pending_count: 0
      };
    }
    if (s.status === SettlementStatus.Pending) {
      acc[key].total_balance += typeof s.balance === 'string' ? parseFloat(s.balance) : s.balance;
      acc[key].pending_count += 1;
    }
    return acc;
  }, {} as Summary);
  return Object.values(summary);
};

export const settleAmount = async (settlement_id: number, _amount: number) => {
  const repo = new SettlementRepository();
  const settlement = await repo.findById(settlement_id);
  if (!settlement) throw new Error('Settlement not found');
  await repo.updateStatus(settlement_id, SettlementStatus.Settled);
  const updated = await repo.findById(settlement_id);
  if (updated) {
    updated.settlement_date = new Date();
    await updated.save();
  }
  return updated;
};

export class SettlementService {
  private settlementRepo = new SettlementRepository();

  async getFarmerNetPayable(shopId: number, farmerId: number) {
    const farmer = await User.findByPk(farmerId);
    const balance = Number(farmer?.balance || 0);
    const expenses = await this.settlementRepo.getPendingExpenses(shopId, farmerId);
    return {
      balance,
      expenses,
      net_payable: balance - expenses
    };
  }
}

export const settlementService = new SettlementService();