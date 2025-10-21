import { Payment, PaymentStatus } from '../models/payment';
import { Shop } from '../models/shop';
import { User } from '../models/user';
import { Transaction } from '../models/transaction';
import { logger } from '../shared/logging/logger';
import { PaymentAllocation } from '../models/paymentAllocation';
import { PARTY_TYPE } from '../shared/partyTypes';

export class OwnerDashboardService {
  // Returns dashboard stats for the owner (by ownerId)
  async getOwnerDashboardStats(ownerId: string | number) {
    const started = Date.now();
    const logPrefix = `[OwnerDashboardService]`;
    try {
      // 1. Get all shops for this owner
      const shops = await Shop.findAll({ where: { owner_id: ownerId } });
      const shopIds = shops.map((s) => s.id);

      // 2. Get all users for these shops
      const users = shopIds.length
        ? await User.findAll({ where: { shop_id: shopIds } })
        : [];

      // 3. Get all transactions for these shops
      const transactions = shopIds.length
        ? await Transaction.findAll({ where: { shop_id: shopIds } })
        : [];

      // 4. Get payment allocations for commission realization calculation
      const transactionIds = transactions.map(t => t.id);
      let allocations: PaymentAllocation[] = [];
  let payments: Payment[] = [];
      try {
        allocations = transactionIds.length
          ? await PaymentAllocation.findAll({ where: { transaction_id: transactionIds } })
          : [];
        payments = transactionIds.length
          ? await (await import('../models/payment')).Payment.findAll({ where: { transaction_id: transactionIds } })
          : [];
      } catch (allocErr) {
        console.warn(`${logPrefix} allocation/payment fetch failed (continuing with zero allocations):`, (allocErr as Error)?.message || allocErr);
      }

  // 5. Calculate stats (+ integrity instrumentation)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { USER_ROLES } = require('../shared/constants');
  const buyers = users.filter((u) => u.role === USER_ROLES.BUYER);
  const farmers = users.filter((u) => u.role === USER_ROLES.FARMER);

      // Debug (only if small cardinality to avoid log spam)
      if (buyers.length <= 20 && farmers.length <= 20) {
        console.log(`${logPrefix} Users snapshot`, {
          buyers: buyers.map(u => ({ id: u.id, balance: u.balance })),
          farmers: farmers.map(u => ({ id: u.id, balance: u.balance }))
        });
      }

      // Get today's date consistently in UTC to match stored timestamps
      const today = new Date().toISOString().split('T')[0];
      console.log(`${logPrefix} Today's date (UTC): ${today}`);
      
      const todayTransactions = transactions.filter((t) => {
        // Use transaction_date (business date) instead of created_at (system timestamp)
        const transactionDate: Date | string | undefined = (t as Transaction & { transaction_date?: Date | string }).transaction_date;
        if (!transactionDate) return false;
        try {
          const dateStr = transactionDate instanceof Date
            ? transactionDate.toISOString().split('T')[0]
            : new Date(transactionDate).toISOString().split('T')[0];
          const isToday = dateStr === today;
          if (transactions.length <= 10) {
            console.log(`${logPrefix} Transaction ${t.id}: transaction_date=${dateStr}, isToday=${isToday}`);
          }
          return isToday;
        } catch (dateErr) {
          console.warn(`${logPrefix} Invalid transaction_date for transaction ${t.id}:`, transactionDate);
          return false;
        }
      });
      
      console.log(`${logPrefix} Found ${todayTransactions.length} transactions for today (${today}) out of ${transactions.length} total`);


      // Calculate buyer_total_spent and farmer_total_earned based on actual payments
      let buyer_total_spent = 0;
      let farmer_total_earned = 0;
      
      // Get actual payment amounts for accurate calculations
      for (const t of transactions) {
        const transactionPayments = payments.filter(p => Number(p.transaction_id) === Number(t.id));
        
        // Buyer payments (what buyers actually paid)
        const buyerPayments = transactionPayments.filter(p => p.payer_type === PARTY_TYPE.BUYER && p.payee_type === PARTY_TYPE.SHOP);
        const buyerPaid = buyerPayments.filter(p => p.status === PaymentStatus.Paid).reduce((sum, p) => sum + Number(p.amount || 0), 0);
        buyer_total_spent += buyerPaid;
        
        // Farmer payments (what farmers actually received)
        const farmerPayments = transactionPayments.filter(p => p.payer_type === PARTY_TYPE.SHOP && p.payee_type === PARTY_TYPE.FARMER);
        const farmerPaid = farmerPayments.filter(p => p.status === PaymentStatus.Paid).reduce((sum, p) => sum + Number(p.amount || 0), 0);
        farmer_total_earned += farmerPaid;
      }
      
      buyer_total_spent = Number(buyer_total_spent.toFixed(2));
      farmer_total_earned = Number(farmer_total_earned.toFixed(2));

      const today_sales = Number(todayTransactions
        .reduce((sum, t) => sum + Number((t as Transaction).total_amount || 0), 0)
        .toFixed(2));
      const today_commission = Number(todayTransactions
        .reduce((sum, t) => sum + Number((t as Transaction).commission_amount || 0), 0)
        .toFixed(2));
        
      // Log today's transaction details for debugging
      if (todayTransactions.length > 0) {
        console.log(`${logPrefix} Today's transactions breakdown:`, todayTransactions.map(t => ({
          id: t.id,
          total_amount: (t as Transaction).total_amount,
          commission_amount: (t as Transaction).commission_amount,
          transaction_date: (t as Transaction & { transaction_date?: Date | string }).transaction_date,
          created_at: t.created_at
        })));
        console.log(`${logPrefix} Today's totals - sales: ${today_sales}, commission: ${today_commission}, count: ${todayTransactions.length}`);
      }

      // Commission realized: sum allocated amounts per transaction, then apply commission rate proportionally
      let commission_realized = 0;
  let rawCommissionSum = 0;
  let recomputedCommissionSum = 0;
  let mismatchCount = 0;
  const mismatchSamples: Array<{ id: number; stored: number; recomputed: number; rate: number; qty: number; unit_price: number }> = [];
  const overAllocated: Array<{ id: number; total: number; buyerPaid: number; over: number }> = [];
  const allocByTxn: Record<string, number> = {};
  const allocMultiMap: Record<string, number> = {};

      // Pre-index allocations for faster lookups
      for (const alloc of allocations) {
        const key = String(alloc.transaction_id);
        allocByTxn[key] = (allocByTxn[key] || 0) + Number(alloc.allocated_amount || 0);
        const dupKey = `${alloc.payment_id}:${alloc.transaction_id}`;
        allocMultiMap[dupKey] = (allocMultiMap[dupKey] || 0) + 1;
      }

      for (const t of transactions) {
        const total = Number((t as Transaction).total_amount || 0);
        const commission = Number((t as Transaction).commission_amount || 0);
        rawCommissionSum += commission;
        const recomputed = Number(((Number((t as Transaction).quantity) * Number((t as Transaction).unit_price) * Number((t as Transaction).commission_rate)) / 100).toFixed(2));
        recomputedCommissionSum += recomputed;
        if (Math.abs(recomputed - commission) > 0.01) {
          mismatchCount++;
          if (mismatchSamples.length < 10) {
            mismatchSamples.push({
              id: t.id,
              stored: commission,
              recomputed,
              rate: (t as Transaction).commission_rate as number,
              qty: (t as Transaction).quantity,
              unit_price: (t as Transaction).unit_price
            });
          }
        }
        const buyerPaid = allocByTxn[String(t.id)] || 0;
        const paidCapped = Math.min(buyerPaid, total);
        const realized = total > 0 ? paidCapped * (commission / (total || 1)) : 0; // safe divide
        commission_realized += realized;
        if (buyerPaid - total > 0.01) {
          if (overAllocated.length < 10) {
            overAllocated.push({ id: t.id, total, buyerPaid, over: Number((buyerPaid - total).toFixed(2)) });
          }
        }
      }
      commission_realized = Number(commission_realized.toFixed(2));

      // Duplicate allocation detection (same payment -> same txn multiple rows)
      const duplicateAllocations: Array<{ key: string; rows: number }> = Object.entries(allocMultiMap)
        .filter(([, count]) => count > 1)
        .slice(0, 10)
        .map(([k, count]) => ({ key: k, rows: count }));

      // Emit integrity log (once per call)
      try {
        logger.info({
          ownerId,
          instrumentation: 'commission_integrity',
          txn_count: transactions.length,
          rawCommissionSum: Number(rawCommissionSum.toFixed(2)),
          recomputedCommissionSum: Number(recomputedCommissionSum.toFixed(2)),
          recomputedDelta: Number((rawCommissionSum - recomputedCommissionSum).toFixed(2)),
          mismatches: mismatchCount,
          mismatchSamples,
          overAllocated,
          duplicateAllocationsCount: duplicateAllocations.length,
          duplicateAllocations
        }, '[OwnerDashboardService] Integrity snapshot');
  } catch(_) { /* ignore logging errors */ }

      const result = {
        today_sales,
        today_transactions: todayTransactions.length,
        today_commission,
        buyer_total_spent,
        farmer_total_earned,
        // Calculate buyer_payments_due: sum of (total_amount - paid) for all transactions
        // Include both PAID and PENDING payments (partial payments count)
        buyer_payments_due: Number(transactions.reduce((sum, t) => {
          const transactionPayments = payments.filter(p => Number(p.transaction_id) === Number(t.id));
          const buyerPayments = transactionPayments.filter(p => p.payer_type === PARTY_TYPE.BUYER && p.payee_type === PARTY_TYPE.SHOP);
          const buyerPaid = buyerPayments.filter(p => p.status === PaymentStatus.Paid || p.status === PaymentStatus.Pending).reduce((s, p) => s + Number(p.amount || 0), 0);
          const totalAmount = Number((t as Transaction).total_amount || 0);
          return sum + Math.max(totalAmount - buyerPaid, 0);
        }, 0).toFixed(2)),
        farmer_payments_due: Number(transactions.reduce((sum, t) => {
          const transactionPayments = payments.filter(p => Number(p.transaction_id) === Number(t.id));
          const farmerPayments = transactionPayments.filter(p => p.payer_type === PARTY_TYPE.SHOP && p.payee_type === PARTY_TYPE.FARMER);
          const farmerPaid = farmerPayments.filter(p => p.status === PaymentStatus.Paid || p.status === PaymentStatus.Pending).reduce((s, p) => s + Number(p.amount || 0), 0);
          const farmerEarning = Number((t as Transaction).farmer_earning || 0);
          return sum + Math.max(farmerEarning - farmerPaid, 0);
        }, 0).toFixed(2)),
        total_users: users.length,
        commission_realized,
        duration_ms: Date.now() - started
      };
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`${logPrefix} Failed to compute dashboard`, { ownerId, error: errorMsg });
      // Safe fallback
      return {
        today_sales: 0,
        today_transactions: 0,
        today_commission: 0,
        buyer_payments_due: 0,
        farmer_payments_due: 0,
        total_users: 0,
        commission_realized: 0,
        error: 'dashboard_unavailable'
      };
    }
  }
}
