import { Request } from 'express';
import { Shop } from '../models/shop';
import { User } from '../models/user';
import { Transaction } from '../models/transaction';

// Returns dashboard stats for the owner (by ownerId)
export async function getOwnerDashboardStats(ownerId: string | number) {
  // 1. Get all shops for this owner
  const shops = await Shop.findAll({ where: { owner_id: ownerId } });
  const shopIds = shops.map((s) => s.id);

  // 2. Get all users for these shops
  const users = await User.findAll({ where: { shop_id: shopIds } });

  // 3. Get all transactions for these shops
  const transactions = await Transaction.findAll({ where: { shop_id: shopIds } });

  // 4. Get payment allocations for commission realization calculation
  const transactionIds = transactions.map(t => t.id);
  const { PaymentAllocation } = require('../models/paymentAllocation');
  const allocations = await PaymentAllocation.findAll({
    where: { transaction_id: transactionIds }
  });

  // 5. Calculate stats
  const buyers = users.filter((u) => u.role === 'buyer');
  const farmers = users.filter((u) => u.role === 'farmer');

  // Debug: log all buyer and farmer balances
  console.log('--- Owner Dashboard Debug ---');
  console.log('Buyers:', buyers.map(u => ({ id: u.id, username: u.username, balance: u.balance })));
  console.log('Farmers:', farmers.map(u => ({ id: u.id, username: u.username, balance: u.balance })));

  // Only consider buyers/farmers who have transactions today
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => {
    const dateStr = t.created_at instanceof Date ? t.created_at.toISOString().split('T')[0] : '';
    return dateStr === today;
  });

  const todayBuyerIds = todayTransactions.map(t => t.buyer_id).filter(Boolean);
  const todayFarmerIds = todayTransactions.map(t => t.farmer_id).filter(Boolean);

  // Sum all positive buyer balances, regardless of transaction date
  const buyer_payments_due = Number(buyers
    .reduce((sum, u) => sum + (Number(u.balance) > 0 ? Number(u.balance) : 0), 0)
    .toFixed(2));

  // Sum all positive farmer balances, not just those with today's transactions
  const farmer_payments_due = Number(farmers
    .reduce((sum, u) => sum + (Number(u.balance) > 0 ? Number(u.balance) : 0), 0)
    .toFixed(2));

  const today_sales = Number(todayTransactions.reduce((sum, t) => sum + Number(t.total_sale_value || 0), 0).toFixed(2));
  const today_commission = Number(todayTransactions.reduce((sum, t) => sum + Number(t.shop_commission || 0), 0).toFixed(2));

  // Commission realized: sum allocated amounts per transaction, then apply commission rate
  let commission_realized = 0;
  for (const t of transactions) {
    const total = Number(t.total_sale_value || 0);
    const commission = Number(t.shop_commission || 0);
    // Sum all allocations for this transaction (represents actual payments received)
    const buyerPaid = allocations
      .filter((alloc: any) => Number(alloc.transaction_id) === Number(t.id))
      .reduce((sum: number, alloc: any) => sum + Number(alloc.allocated_amount || 0), 0);
    const paidCapped = Math.min(buyerPaid, total);
    const realized = total > 0 ? paidCapped * (commission / total) : 0;
    commission_realized += realized;
  }
  commission_realized = Number(commission_realized.toFixed(2));



  return {
    today_sales,
    today_transactions: todayTransactions.length,
    today_commission,

    buyer_payments_due,
    farmer_payments_due,
    total_users: users.length,
    commission_realized
  };
}
