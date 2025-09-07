// Transaction service stub

import { Transaction } from '../models/transaction';
import { Shop } from '../models/shop';
import { Plan } from '../models/plan';
import { z } from 'zod';
import { TransactionSchema } from '../schemas/transaction';
import { Op } from 'sequelize';


export const getTransactions = async (filters: { 
  shop_id?: string, 
  date_from?: string, 
  date_to?: string,
  buyer_id?: string,
  status?: string,
  include_analytics?: string,
  owner_id?: string
}) => {
  try {
    const where: any = {};

    // If shop_id is not provided, try to infer from owner_id
    let shopId = filters.shop_id;
    if (!shopId && filters.owner_id) {
      // Find the shop for this owner
      const shop = await Shop.findOne({ where: { owner_id: filters.owner_id } });
      if (shop) {
        shopId = shop.id.toString();
      }
    }
    if (shopId) {
      where.shop_id = parseInt(shopId);
    }

    // Default date range: past week to today if not provided
    let dateFrom = filters.date_from;
    let dateTo = filters.date_to;
    if (!dateFrom || !dateTo) {
      const today = new Date();
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      dateFrom = dateFrom || pastWeek.toISOString().slice(0, 10);
      dateTo = dateTo || today.toISOString().slice(0, 10);
    }
    if (dateFrom && dateTo) {
      where.transaction_date = {
        [Op.gte]: new Date(dateFrom + 'T00:00:00.000Z'),
        [Op.lte]: new Date(dateTo + 'T23:59:59.999Z')
      };
    }

    // Add buyer_id filter if provided
    if (filters.buyer_id) {
      where.buyer_id = filters.buyer_id;
    }

    // Add status filter if provided
    if (filters.status) {
      where.status = filters.status;
    }

    console.log('Transaction query filters:', where);

    const { User } = await import('../models/user');
    const { Product } = await import('../models/product');
    const { Category } = await import('../models/category');

    const transactions = await Transaction.findAll({
      where,
      order: [['transaction_date', 'DESC']],
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'username', 'role'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'category_id'],
          include: [
            { model: Category, as: 'category', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    // Map to DTO
    const transactionDTOs = transactions.map((t: any) => ({
      id: t.id,
      shop_id: t.shop_id,
      buyer: t.buyer ? { id: t.buyer.id, username: t.buyer.username, role: t.buyer.role } : null,
      product: t.product ? {
        id: t.product.id,
        name: t.product.name,
        category: t.product.category ? { id: t.product.category.id, name: t.product.category.name } : null
      } : null,
      quantity: t.quantity,
      price: t.price,
      total: t.total,
      status: t.status,
      transaction_date: t.transaction_date,
      created_at: t.created_at,
      updated_at: t.updated_at
    }));

    console.log(`Found ${transactionDTOs.length} transactions`);

    // Calculate analytics if requested
    let analytics = null;
    if (filters.include_analytics === 'true') {
      const totalIncome = transactionDTOs.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0);
      const statusSummary = transactionDTOs.reduce((acc: any, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      const incomeByStatus = transactionDTOs.reduce((acc: any, t) => {
        acc[t.status] = (acc[t.status] || 0) + parseFloat(t.total.toString());
        return acc;
      }, {});
      analytics = {
        total_transactions: transactionDTOs.length,
        total_income: totalIncome,
        status_summary: statusSummary,
        income_by_status: incomeByStatus,
        date_range: { from: dateFrom, to: dateTo }
      };
    }
    return { transactions: transactionDTOs, analytics };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { transactions: [], analytics: null };
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

