import { Settlement, SettlementStatus, SettlementReason } from '../models/settlement';
import { User } from '../models/user';
import { Op } from 'sequelize';
import { SettlementRepository } from '../repositories/SettlementRepository';

// FIFO repayment logic: When a payment is made, settle oldest pending settlements first
export const applyRepaymentFIFO = async (shop_id: number, user_id: number, repaymentAmount: number) => {
  // Fetch all pending settlements for this shop/user, oldest first
  const pendingSettlements = await Settlement.findAll({
    where: {
      shop_id,
      user_id,
      status: SettlementStatus.Pending
    },
    order: [['created_at', 'ASC']]
  });

  let remaining = repaymentAmount;
  const updates = [];
  for (const settlement of pendingSettlements) {
    if (remaining <= 0) break;
    const originalAmount = typeof settlement.amount === 'string' ? parseFloat(settlement.amount) : settlement.amount;
    const settleAmt = Math.min(remaining, originalAmount);
    // If full amount is settled, mark as settled
    if (settleAmt === originalAmount) {
  await settlement.update({ status: SettlementStatus.Settled, settlement_date: new Date() });
      updates.push({ id: settlement.id, settled: settleAmt });
    } else {
      // Partial settlement: reduce amount, keep status pending
      const newAmount = originalAmount - settleAmt;
      await settlement.update({ amount: newAmount });
      updates.push({ id: settlement.id, partial: settleAmt });
    }
    remaining -= settleAmt;
  }
  return { updates, remaining };
};

export const createSettlement = async (data: {
  shop_id: number;
  user_id: string;
  user_type: 'farmer' | 'buyer';
  transaction_id?: number;
  amount: number;
  type: 'overpayment' | 'underpayment' | 'settlement' | 'expense' | 'payment_received' | 'payment_made';
  description: string;
}) => {
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
  const settlement = await Settlement.create({
    shop_id: data.shop_id,
    user_id: parseInt(data.user_id),
    amount: data.amount,
    reason,
    status: SettlementStatus.Pending
  });

  // NOTE: Expenses do NOT modify user balance directly
  // Balance = Transaction earnings only
  // Expenses = Separate debt tracking
  // Frontend will show: Net Payable = Balance - Pending Expenses
  
  console.log('[SETTLEMENT] Settlement created', {
    settlementId: settlement.id,
    type: data.type,
    userId: parseInt(data.user_id),
    amount: data.amount,
    status: 'pending'
  });

  return settlement;
};

export const getSettlements = async (filters: {
  shop_id: string;
  user_id?: string;
  user_type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}) => {
  const where: Record<string, unknown> = { shop_id: parseInt(filters.shop_id) };
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.user_type) where.user_type = filters.user_type;
  if (filters.status) where.status = filters.status as SettlementStatus;
  if (filters.from_date || filters.to_date) {
  const dateRange: { [key: string | symbol]: unknown } = {};
    if (filters.from_date) dateRange[Op.gte] = new Date(filters.from_date);
    if (filters.to_date) dateRange[Op.lte] = new Date(filters.to_date);
    where.created_at = dateRange;
  }
  const settlements = await Settlement.findAll({
    where,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: 'settlementUser',
        attributes: ['id', 'username', 'role'],
        required: false
      }
    ]
  });
  return settlements;
};

/**
 * Calculate net payable amount for a farmer
 * Net Payable = Balance (from transactions) - Pending Expenses (advances)
 */
export const getFarmerNetPayable = async (shop_id: number, farmer_id: number) => {
  // Get farmer's current balance (from transaction earnings)
  const farmer = await User.findByPk(farmer_id);
  const currentBalance = Number(farmer?.balance || 0);

  // Get pending expenses for this farmer in this shop
  const pendingExpenses = await Settlement.findAll({
    where: {
      shop_id,
      user_id: farmer_id,
      status: SettlementStatus.Pending,
      reason: SettlementReason.Adjustment // This covers expenses
    }
  });

  const totalPendingExpenses = pendingExpenses.reduce((sum, settlement) => {
    return sum + Number(settlement.amount || 0);
  }, 0);

  const netPayable = currentBalance - totalPendingExpenses;

  return {
    farmer_id,
    current_balance: currentBalance,
    pending_expenses: totalPendingExpenses,
    net_payable: Math.max(0, netPayable), // Don't show negative
    expenses_breakdown: pendingExpenses.map(exp => ({
      id: exp.id,
      amount: exp.amount,
      created_at: exp.created_at,
      description: 'Farmer advance/expense'
    }))
  };
};

export const getSettlementSummary = async (shop_id: string) => {
  const settlements = await Settlement.findAll({
    where: { shop_id: parseInt(shop_id) },
    attributes: ['user_id', 'user_type', 'balance', 'status'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['username'],
        required: false
      }
    ]
  });

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
  const summary = settlements.reduce((acc: Summary, s: unknown) => {
    const settlement = s as {
      user_id: number | string;
      user_type: string;
      user?: { username?: string };
      balance: string | number;
      status: string;
    };
    const key = `${settlement.user_type}_${settlement.user_id}`;
    if (!acc[key]) {
      acc[key] = {
        user_id: String(settlement.user_id),
        user_type: settlement.user_type,
        username: settlement.user?.username || 'Unknown',
        total_balance: 0,
        pending_count: 0
      };
    }
    if (settlement.status === SettlementStatus.Pending) {
      acc[key].total_balance += typeof settlement.balance === 'string' ? parseFloat(settlement.balance) : settlement.balance;
      acc[key].pending_count += 1;
    }
    return acc;
  }, {} as Summary);

  return Object.values(summary);
};

export const settleAmount = async (settlement_id: number, _amount: number) => {
  const settlement = await Settlement.findByPk(settlement_id);
  if (!settlement) throw new Error('Settlement not found');

  await settlement.update({
    status: SettlementStatus.Settled,
    settlement_date: new Date()
  });

  return settlement.reload();
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