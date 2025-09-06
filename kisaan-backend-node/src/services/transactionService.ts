// Transaction service stub

import { Transaction } from '../models/transaction';
import { Shop } from '../models/shop';
import Plan from '../models/plan';
import { z } from 'zod';
import { TransactionSchema } from '../schemas/transaction';
import { Op } from 'sequelize';


export const getTransactions = async (filters: { 
  shop_id?: string, 
  date_from?: string, 
  date_to?: string,
  buyer_id?: string,
  status?: string,
  include_analytics?: string
}) => {
  try {
    const where: any = {};
    
    // Add shop_id filter if provided
    if (filters.shop_id) {
      where.shop_id = parseInt(filters.shop_id);
    }
    
    // Add buyer_id filter if provided
    if (filters.buyer_id) {
      where.buyer_id = filters.buyer_id;
    }
    
    // Add status filter if provided
    if (filters.status) {
      where.status = filters.status;
    }
    
    // Add date range filter if provided
    if (filters.date_from && filters.date_to) {
      where.transaction_date = {
        [Op.gte]: new Date(filters.date_from + 'T00:00:00.000Z'),
        [Op.lte]: new Date(filters.date_to + 'T23:59:59.999Z')
      };
    }
    
    console.log('Transaction query filters:', where);
    
    const transactions = await Transaction.findAll({
      where,
      order: [['transaction_date', 'DESC']]
    });
    
    console.log(`Found ${transactions.length} transactions`);
    
    // Calculate analytics if requested
    let analytics = null;
    if (filters.include_analytics === 'true') {
      const totalIncome = transactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0);
      const statusSummary = transactions.reduce((acc: any, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      const incomeByStatus = transactions.reduce((acc: any, t) => {
        acc[t.status] = (acc[t.status] || 0) + parseFloat(t.total.toString());
        return acc;
      }, {});
      analytics = {
        total_transactions: transactions.length,
        total_income: totalIncome,
        status_summary: statusSummary,
        income_by_status: incomeByStatus,
        date_range: filters.date_from && filters.date_to ? {
          from: filters.date_from,
          to: filters.date_to
        } : null
      };
    }
    return { transactions, analytics };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

export const createTransaction = async (data: any) => {
  // Validate input
  const validated = TransactionSchema.parse(data);

  // Fetch shop and plan to get commission rate (if needed in future)

  // Calculate total if not provided
  const total = validated.total || validated.price * validated.quantity;

  // Status logic: if status is set by owner, use it; else calculate in backend
  let status = (data.status as 'paid' | 'pending' | 'partial' | 'credit' | undefined) || undefined;
  if (!status) {
    status = (data.payment_status && data.payment_status === 'paid') ? 'paid' : 'pending';
  }

  // Create transaction
  const transaction = await Transaction.create({
    ...validated,
    transaction_date: new Date(validated.transaction_date),
    total,
    status,
  });

  return transaction;
};

  // TODO: Implement get transaction by id

