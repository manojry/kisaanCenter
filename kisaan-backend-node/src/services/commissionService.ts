// Commission service stub

import { Commission } from '../models/commission';
import { Transaction } from '../models/transaction';

// Example: 2% commission
const COMMISSION_RATE = 0.02;

export const calculateCommission = async (transactionId: number) => {
  const transaction = await Transaction.findByPk(transactionId);
  if (!transaction) throw new Error('Transaction not found');
  const amount = Number(transaction.total) * COMMISSION_RATE;
  const commission = await Commission.create({
    shop_id: transaction.shop_id,
    transaction_id: transaction.id,
    amount,
    calculated_at: new Date(),
  });
  return commission;
};


export const getCommissionSummary = async (shopId: number) => {
  const commissions = await Commission.findAll({ where: { shop_id: shopId } });
  const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  return { shop_id: shopId, total_commission: total, count: commissions.length };
};
