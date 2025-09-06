// Transaction service stub

import { Transaction } from '../models/transaction';
import { z } from 'zod';
import { TransactionSchema } from '../schemas/transaction';
import { Op } from 'sequelize';

export const createTransaction = async (data: any) => {
  // Validate input
  const validated = TransactionSchema.parse(data);
  // Calculate total if not provided
  const total = validated.total || validated.price * validated.quantity;
  // Create transaction
  const transaction = await Transaction.create({
    ...validated,
    transaction_date: new Date(validated.transaction_date),
    total,
    status: 'pending',
  });
  return transaction;
};

export const getTransactions = async (filters: { shop_id?: string, date_from?: string, date_to?: string }) => {
  try {
    const where: any = {};
    
    // Add shop_id filter if provided
    if (filters.shop_id) {
      where.shop_id = parseInt(filters.shop_id);
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
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getTransaction = async (id: number) => {
  // TODO: Implement get transaction by id
};
