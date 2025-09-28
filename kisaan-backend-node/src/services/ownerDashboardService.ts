import { Request } from 'express';
import { Shop } from '../models/shop';
import { User } from '../models/user';
import { Transaction } from '../models/transaction';
import { logger } from '../shared/logging/logger';

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
      let allocations: any[] = [];
      try {
        const { PaymentAllocation } = require('../models/paymentAllocation');
        allocations = transactionIds.length
          ? await PaymentAllocation.findAll({ where: { transaction_id: transactionIds } })
          : [];
      } catch (allocErr: any) {
        console.warn(`${logPrefix} allocation fetch failed (continuing with zero allocations):`, allocErr?.message || allocErr);
      }

  // 5. Calculate stats (+ integrity instrumentation)
      const buyers = users.filter((u) => u.role === 'buyer');
      const farmers = users.filter((u) => u.role === 'farmer');

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
        const transactionDate = (t as any).transaction_date;
        if (!transactionDate) return false;
        
        try {
          const dateStr = transactionDate instanceof Date 
            ? transactionDate.toISOString().split('T')[0] 
            : new Date(transactionDate).toISOString().split('T')[0];
            
          const isToday = dateStr === today;
          if (transactions.length <= 10) { // Only log for small datasets to avoid spam
            console.log(`${logPrefix} Transaction ${t.id}: transaction_date=${dateStr}, isToday=${isToday}`);
          }
          return isToday;
        } catch (dateErr) {
          console.warn(`${logPrefix} Invalid transaction_date for transaction ${t.id}:`, transactionDate);
          return false;
        }
      });
      
      console.log(`${logPrefix} Found ${todayTransactions.length} transactions for today (${today}) out of ${transactions.length} total`);

      // Sum all positive buyer balances, regardless of transaction date
      const buyer_payments_due = Number(buyers
        .reduce((sum, u) => sum + (Number(u.balance) > 0 ? Number(u.balance) : 0), 0)
        .toFixed(2));

      // Sum all positive farmer balances
      const farmer_payments_due = Number(farmers
        .reduce((sum, u) => sum + (Number(u.balance) > 0 ? Number(u.balance) : 0), 0)
        .toFixed(2));

      const today_sales = Number(todayTransactions
        .reduce((sum, t) => sum + Number((t as any).total_amount || 0), 0)
        .toFixed(2));
      const today_commission = Number(todayTransactions
        .reduce((sum, t) => sum + Number((t as any).commission_amount || 0), 0)
        .toFixed(2));
        
      // Log today's transaction details for debugging
      if (todayTransactions.length > 0) {
        console.log(`${logPrefix} Today's transactions breakdown:`, todayTransactions.map(t => ({
          id: t.id,
          total_amount: (t as any).total_amount,
          commission_amount: (t as any).commission_amount,
          transaction_date: (t as any).transaction_date,
          created_at: t.created_at
        })));
        console.log(`${logPrefix} Today's totals - sales: ${today_sales}, commission: ${today_commission}, count: ${todayTransactions.length}`);
      }

      // Commission realized: sum allocated amounts per transaction, then apply commission rate proportionally
      let commission_realized = 0;
      let rawCommissionSum = 0;
      let recomputedCommissionSum = 0;
      let mismatchCount = 0;
      const mismatchSamples: any[] = [];
      const overAllocated: any[] = [];
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
        const total = Number((t as any).total_amount || 0);
        const commission = Number((t as any).commission_amount || 0);
        rawCommissionSum += commission;
        const recomputed = Number(((Number((t as any).quantity) * Number((t as any).unit_price) * Number((t as any).commission_rate)) / 100).toFixed(2));
        recomputedCommissionSum += recomputed;
        if (Math.abs(recomputed - commission) > 0.01) {
          mismatchCount++;
          if (mismatchSamples.length < 10) {
            mismatchSamples.push({ id: t.id, stored: commission, recomputed, rate: (t as any).commission_rate, qty: (t as any).quantity, unit_price: (t as any).unit_price });
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
      const duplicateAllocations = Object.entries(allocMultiMap)
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
      } catch(_) {}

      const result = {
        today_sales,
        today_transactions: todayTransactions.length,
        today_commission,
        buyer_payments_due,
        farmer_payments_due,
        total_users: users.length,
        commission_realized,
        duration_ms: Date.now() - started
      };
      return result;
    } catch (err: any) {
      console.error(`${logPrefix} Failed to compute dashboard`, { ownerId, error: err?.message || err });
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
