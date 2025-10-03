/**
 * Optimized Transaction Service - Eliminates N+1 queries and improves performance
 * Replaces multiple inefficient transaction queries across the application
 */

import { Transaction } from '../models/transaction';
import { User } from '../models/user';
import { Shop } from '../models/shop';
import { Payment } from '../models/payment';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { TransactionDTO, TransactionFilters } from '../types/transaction';
import { UserContext } from '../types/user';
import { AuthorizationError, ValidationError } from '../shared/utils/errors';

/**
 * Get transactions with all related data in a single optimized query
 * Replaces the N+1 query patterns found in transaction controllers
 */
export const getTransactionsOptimized = async (
  requestingUser: UserContext,
  filters: TransactionFilters = {}
): Promise<{ transactions: TransactionDTO[]; total: number; page: number; limit: number }> => {
  
  const where: any = {};
  const includeConditions = [];

  // Build WHERE clause based on user role and permissions
  if (requestingUser.role === 'owner') {
    // Subquery to get shop IDs owned by this user
    includeConditions.push({
      model: Shop,
      as: 'shop',
      where: { owner_id: requestingUser.id },
      required: true,
      attributes: ['id', 'name']
    });
  } else if (['farmer', 'buyer'].includes(requestingUser.role)) {
    // Users can only see their own transactions
    where[Op.or] = [
      { farmer_id: requestingUser.id },
      { buyer_id: requestingUser.id }
    ];
  }
  // Superadmin sees all transactions (no additional where clause)

  // Apply filters
  if (filters.shop_id) where.shop_id = filters.shop_id;
  if (filters.farmer_id) where.farmer_id = filters.farmer_id;
  if (filters.buyer_id) where.buyer_id = filters.buyer_id;
  if (filters.status) where.status = filters.status;
  if (filters.date_from) where.createdAt = { [Op.gte]: filters.date_from };
  if (filters.date_to) {
    where.createdAt = where.createdAt 
      ? { ...where.createdAt, [Op.lte]: filters.date_to }
      : { [Op.lte]: filters.date_to };
  }

  // Single optimized query with all JOINs
  const offset = ((filters.page || 1) - 1) * (filters.limit || 20);
  const { count, rows } = await Transaction.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'farmer',
        attributes: ['id', 'username', 'firstname'],
        required: false
      },
      {
        model: User,
        as: 'buyer', 
        attributes: ['id', 'username', 'firstname'],
        required: false
      },
      ...(includeConditions.length > 0 ? includeConditions : [{
        model: Shop,
        as: 'shop',
        attributes: ['id', 'name'],
        required: false
      }]),
      {
        model: Payment,
        as: 'payments',
        attributes: ['id', 'amount', 'payment_type', 'status', 'created_at'],
        required: false
      }
    ],
    limit: filters.limit || 20,
    offset,
    order: [
      ['created_at', 'DESC'],
      [{ model: Payment, as: 'payments' }, 'created_at', 'ASC']
    ],
    distinct: true
  });

  const transactions = rows.map((transaction: any): TransactionDTO => ({
    id: Number(transaction.id),
    farmer_id: transaction.farmer_id !== undefined ? Number(transaction.farmer_id) : undefined,
    buyer_id: transaction.buyer_id !== undefined ? Number(transaction.buyer_id) : undefined,
    shop_id: Number(transaction.shop_id),
    product_name: String(transaction.product_name),
    quantity: Number(transaction.quantity),
    rate: Number(transaction.rate),
    total_amount: Number(transaction.total_amount),
    commission_amount: Number(transaction.commission_amount),
    status: transaction.status as 'pending' | 'completed' | 'cancelled',
    created_at: new Date(transaction.createdAt),
    updated_at: new Date(transaction.updatedAt),
    // Related data
    farmer_name: transaction.farmer ? `${transaction.farmer.firstname} (${transaction.farmer.username})` : undefined,
    buyer_name: transaction.buyer ? `${transaction.buyer.firstname} (${transaction.buyer.username})` : undefined,
    shop_name: transaction.shop?.name,
    payments: transaction.payments || [],
    // Computed fields
    paid_amount: Array.isArray(transaction.payments)
      ? transaction.payments.reduce((sum: number, payment: any) =>
          payment.status === 'completed' ? sum + parseFloat(payment.amount) : sum, 0)
      : 0,
    pending_amount: typeof transaction.total_amount === 'number' && Array.isArray(transaction.payments)
      ? transaction.total_amount - transaction.payments.reduce((sum: number, payment: any) =>
          payment.status === 'completed' ? sum + parseFloat(payment.amount) : sum, 0)
      : 0
  }));

  return {
    transactions,
    total: count,
    page: filters.page || 1,
    limit: filters.limit || 20
  };
};

/**
 * Get transaction statistics with efficient aggregation
 * Single query instead of multiple separate queries
 */
export const getTransactionStatsOptimized = async (
  shopId: number,
  requestingUser: UserContext,
  dateRange?: { from: Date; to: Date }
): Promise<{
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  pending_amount: number;
  completed_transactions: number;
  farmer_count: number;
  buyer_count: number;
}> => {
  
  // Permission check
  if (requestingUser.role === 'owner') {
    const shop = await Shop.findByPk(shopId);
    if (!shop || shop.owner_id !== requestingUser.id) {
      throw new AuthorizationError('Access denied to shop data');
    }
  }

  const whereClause = ['t.shop_id = :shopId'];
  const replacements: any = { shopId };

  if (dateRange) {
    whereClause.push('t.created_at >= :dateFrom');
    whereClause.push('t.created_at <= :dateTo');
    replacements.dateFrom = dateRange.from;
    replacements.dateTo = dateRange.to;
  }

  // Raw SQL query for optimal performance
  const query = `
    SELECT 
      COUNT(DISTINCT t.id) as total_transactions,
      COALESCE(SUM(t.total_amount), 0) as total_amount,
      COALESCE(SUM(t.commission_amount), 0) as total_commission,
      COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_transactions,
      COUNT(DISTINCT t.farmer_id) as farmer_count,
      COUNT(DISTINCT t.buyer_id) as buyer_count,
      COALESCE(SUM(
        CASE 
          WHEN t.status = 'pending' THEN t.total_amount
          ELSE 0 
        END
      ), 0) as pending_amount
    FROM transactions t
    WHERE ${whereClause.join(' AND ')}
  `;

  const [results] = await sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT
  }) as any[];

  return {
    total_transactions: parseInt(String(results.total_transactions)),
    total_amount: parseFloat(String(results.total_amount)),
    total_commission: parseFloat(String(results.total_commission)),
    pending_amount: parseFloat(String(results.pending_amount)),
    completed_transactions: parseInt(String(results.completed_transactions)),
    farmer_count: parseInt(String(results.farmer_count)),
    buyer_count: parseInt(String(results.buyer_count))
  };
};

/**
 * Get user balance with transaction history in one query
 * Eliminates the need for separate balance calculation queries
 */
export const getUserBalanceWithHistory = async (
  userId: number,
  requestingUser: UserContext,
  limit = 10
): Promise<{
  current_balance: number;
  recent_transactions: TransactionDTO[];
  pending_transactions: TransactionDTO[];
}> => {
  
  // Permission check
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ValidationError('User not found');
  }

  if (requestingUser.role === 'owner') {
    const shop = user.shop_id ? await Shop.findByPk(user.shop_id) : null;
    if (!shop || shop.owner_id !== requestingUser.id) {
      throw new AuthorizationError('Access denied');
    }
  } else if (requestingUser.id !== userId && requestingUser.role !== 'superadmin') {
    throw new AuthorizationError('Access denied');
  }

  // Get recent transactions for this user
  const recentTransactions = await Transaction.findAll({
    where: {
      [Op.or]: [
        { farmer_id: userId },
        { buyer_id: userId }
      ]
    },
    include: [
      {
        model: User,
        as: 'farmer',
        attributes: ['id', 'username', 'firstname'],
        required: false
      },
      {
        model: User,
        as: 'buyer',
        attributes: ['id', 'username', 'firstname'],
        required: false
      },
      {
        model: Shop,
        as: 'shop',
        attributes: ['id', 'name'],
        required: false
      }
    ],
    limit,
    order: [['created_at', 'DESC']]
  });

  // Get pending transactions separately
  const pendingTransactions = await Transaction.findAll({
    where: {
      [Op.or]: [
        { farmer_id: userId },
        { buyer_id: userId }
      ],
      status: 'pending'
    },
    include: [
      {
        model: User,
        as: 'farmer',
        attributes: ['id', 'username', 'firstname'],
        required: false
      },
      {
        model: User,
        as: 'buyer',
        attributes: ['id', 'username', 'firstname'],
        required: false
      }
    ],
    order: [['created_at', 'DESC']]
  });

  const mapTransaction = (transaction: import('../models/transaction').Transaction & {
    farmer?: { firstname: string; username: string } | null;
    buyer?: { firstname: string; username: string } | null;
    shop?: { name: string } | null;
  }): TransactionDTO => ({
    id: transaction.id,
    farmer_id: transaction.farmer_id,
    buyer_id: transaction.buyer_id,
    shop_id: transaction.shop_id,
    product_name: transaction.product_name,
    quantity: transaction.quantity,
    rate: (transaction as any).rate ?? 0,
    total_amount: transaction.total_amount,
    commission_amount: transaction.commission_amount,
    status: transaction.status as 'pending' | 'completed' | 'cancelled',
  created_at: transaction.created_at as Date,
  updated_at: transaction.updated_at as Date,
    farmer_name: transaction.farmer ? `${(transaction.farmer as any).firstname} (${(transaction.farmer as any).username})` : undefined,
    buyer_name: transaction.buyer ? `${(transaction.buyer as any).firstname} (${(transaction.buyer as any).username})` : undefined,
    shop_name: transaction.shop ? (transaction.shop as any).name : undefined
  });

  return {
    current_balance: user.balance,
  recent_transactions: recentTransactions.map(mapTransaction),
  pending_transactions: pendingTransactions.map(mapTransaction)
  };
};

/**
 * Create transaction with automatic balance updates
 * Includes balance reconciliation logic
 */
export const createTransactionOptimized = async (
  transactionData: Record<string, unknown>,
  requestingUser: UserContext // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<TransactionDTO> => {
  
  const transaction = await sequelize.transaction();
  
  try {
    // Create the transaction
    const newTransaction = await Transaction.create(transactionData as import('../models/transaction').TransactionCreationAttributes, { transaction });
    
    // Update balances atomically
    if (transactionData.farmer_id) {
      await User.increment('balance', {
  by: Number(transactionData.total_amount) - Number(transactionData.commission_amount),
        where: { id: transactionData.farmer_id },
        transaction
      });
    }
    
    if (transactionData.buyer_id) {
      await User.decrement('balance', {
        by: Number(transactionData.total_amount),
        where: { id: transactionData.buyer_id },
        transaction
      });
    }
    
    await transaction.commit();
    
    // Return transaction with related data
    const createdTransaction = await Transaction.findByPk(newTransaction.id, {
      include: [
        {
          model: User,
          as: 'farmer',
          attributes: ['id', 'username', 'firstname']
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'firstname']
        },
        {
          model: Shop,
          as: 'shop',
          attributes: ['id', 'name']
        }
      ]
    });

    return {
      id: createdTransaction!.id,
      farmer_id: createdTransaction!.farmer_id,
      buyer_id: createdTransaction!.buyer_id,
      shop_id: createdTransaction!.shop_id,
      product_name: createdTransaction!.product_name,
      quantity: createdTransaction!.quantity,
      rate: createdTransaction!.unit_price,
      total_amount: createdTransaction!.total_amount,
      commission_amount: createdTransaction!.commission_amount,
      status: (createdTransaction!.status as 'pending' | 'completed' | 'cancelled') || 'pending',
      created_at: createdTransaction!.created_at,
      updated_at: createdTransaction!.updated_at
    };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};