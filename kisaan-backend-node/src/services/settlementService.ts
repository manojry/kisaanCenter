import { Settlement } from '../models/settlement';
import { User } from '../models/user';
import { Op } from 'sequelize';

export const createSettlement = async (data: {
  shop_id: number;
  user_id: string;
  user_type: 'farmer' | 'buyer';
  transaction_id?: number;
  amount: number;
  type: 'overpayment' | 'underpayment' | 'settlement' | 'expense' | 'payment_received' | 'payment_made';
  description: string;
}) => {
  const settlement = await Settlement.create({
    shop_id: data.shop_id,
    user_id: parseInt(data.user_id),
    amount: data.amount,
    reason: data.type === 'overpayment' || data.type === 'underpayment' ? data.type : 'adjustment',
    status: 'pending'
  });
  return settlement;
};

export const getSettlements = async (filters: {
  shop_id: string;
  user_id?: string;
  user_type?: string;
  status?: string;
}) => {
  const where: any = { shop_id: parseInt(filters.shop_id) };
  
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.user_type) where.user_type = filters.user_type;
  if (filters.status) where.status = filters.status;

  const settlements = await Settlement.findAll({
    where,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'role'],
        required: false
      }
    ]
  });

  return settlements;
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

  const summary = settlements.reduce((acc: any, settlement: any) => {
    const key = `${settlement.user_type}_${settlement.user_id}`;
    if (!acc[key]) {
      acc[key] = {
        user_id: settlement.user_id,
        user_type: settlement.user_type,
        username: settlement.user?.username || 'Unknown',
        total_balance: 0,
        pending_count: 0
      };
    }
    
    if (settlement.status === 'pending') {
      acc[key].total_balance += parseFloat(settlement.balance);
      acc[key].pending_count += 1;
    }
    
    return acc;
  }, {});

  return Object.values(summary);
};

export const settleAmount = async (settlement_id: number, amount: number) => {
  const settlement = await Settlement.findByPk(settlement_id);
  if (!settlement) throw new Error('Settlement not found');

  await settlement.update({
    status: 'settled',
    settlement_date: new Date()
  });

  return settlement.reload();
};