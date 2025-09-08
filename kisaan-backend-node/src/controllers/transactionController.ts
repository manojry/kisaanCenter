import { Request, Response } from 'express';
import { Transaction, User, Shop } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Op } from 'sequelize';

// Helper function to get user's shop_id
const getUserShopId = async (userId: number): Promise<number | null> => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  
  // If user has direct shop_id, return it
  if (user.shop_id) return user.shop_id;
  
  // If user is owner, find their shop
  if (user.role === 'owner' && user.owner_id) {
    const shop = await Shop.findOne({ where: { owner_id: user.owner_id } });
    return shop?.id || null;
  }
  
  return null;
};

// Get all transactions with optional filtering
export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shop_id, date_from, date_to, status, page = 1, limit = 10 } = req.query;
    
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    // Build filter conditions using user's shop_id
    const where: any = {
      shop_id: shop_id ? parseInt(shop_id as string) : userShopId
    };
    
    if (status) {
      const statusArray = (status as string).split(',');
      where.status = statusArray.length > 1 ? statusArray : status;
    }
    
    // Add date filtering if provided
    if (date_from || date_to) {
      where.transaction_date = {};
      if (date_from) where.transaction_date[Op.gte] = new Date(date_from as string);
      if (date_to) where.transaction_date[Op.lte] = new Date(date_to as string);
    }

    const transactions = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(transactions.count / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// Get single transaction
export const getTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findByPk(id, {
      include: [
        // Include related models like buyer, items, etc.
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transaction' });
  }
};

// Create new transaction
export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactionData = req.body;
    
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    // Validate required fields
    if (!transactionData.buyer_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Buyer ID is required' 
      });
    }

    // Set shop_id from authenticated user
    const finalTransactionData = {
      ...transactionData,
      shop_id: userShopId
    };

    const transaction = await Transaction.create(finalTransactionData);
    
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to create transaction' });
  }
};

// Create sale (specific transaction type)
export const createSale = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const saleData = req.body;
    
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    // Add sale-specific logic
    const transactionData = {
      ...saleData,
      shop_id: userShopId,
      type: 'sale',
      status: 'pending'
    };

    const transaction = await Transaction.create(transactionData);
    
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ success: false, message: 'Failed to create sale' });
  }
};

// Update transaction
export const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const [updatedRowsCount] = await Transaction.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const updatedTransaction = await Transaction.findByPk(id);
    res.json({ success: true, data: updatedTransaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to update transaction' });
  }
};

// Complete transaction
export const completeTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [updatedRowsCount] = await Transaction.update(
      { status: 'completed' },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const transaction = await Transaction.findByPk(id);
    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error completing transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to complete transaction' });
  }
};

// Cancel transaction
export const cancelTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [updatedRowsCount] = await Transaction.update(
      { status: 'cancelled' },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const transaction = await Transaction.findByPk(id);
    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel transaction' });
  }
};

// Update buyer payment
export const updateBuyerPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const [updatedRowsCount] = await Transaction.update(
      { buyer_paid: amount },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const transaction = await Transaction.findByPk(id);
    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error updating buyer payment:', error);
    res.status(500).json({ success: false, message: 'Failed to update buyer payment' });
  }
};

// Update farmer payment
export const updateFarmerPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const [updatedRowsCount] = await Transaction.update(
      { farmer_paid: amount },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const transaction = await Transaction.findByPk(id);
    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error updating farmer payment:', error);
    res.status(500).json({ success: false, message: 'Failed to update farmer payment' });
  }
};

// Get transaction summary
export const getTransactionSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Calculate summary based on your business logic
    const summary = {
      transaction_id: transaction.id,
      total_amount: transaction.total,
      commission_amount: transaction.commission_amount || 0,
      farmer_amount: transaction.total - (transaction.commission_amount || 0),
      buyer_paid: transaction.buyer_paid || 0,
      farmer_paid: transaction.farmer_paid || 0,
      buyer_balance: transaction.total - (transaction.buyer_paid || 0),
      farmer_balance: (transaction.total - (transaction.commission_amount || 0)) - (transaction.farmer_paid || 0)
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting transaction summary:', error);
    res.status(500).json({ success: false, message: 'Failed to get transaction summary' });
  }
};

// Get incomplete transactions
export const getIncompleteTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shop_id, page = 1, limit = 10 } = req.query;

    const where: any = {
      status: ['pending', 'partial', 'credit']
    };

    if (shop_id) where.shop_id = shop_id;

    const transactions = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching incomplete transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch incomplete transactions' });
  }
};

// Get transactions by shop
export const getTransactionsByShop = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.findAndCountAll({
      where: { shop_id: shopId },
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching shop transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shop transactions' });
  }
};

// Get transactions by buyer
export const getTransactionsByBuyer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { buyerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.findAndCountAll({
      where: { buyer_id: buyerId },
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching buyer transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch buyer transactions' });
  }
};

// Get transactions by farmer
export const getTransactionsByFarmer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.findAndCountAll({
      where: { farmer_id: farmerId },
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching farmer transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch farmer transactions' });
  }
};

// Delete transaction
export const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Only allow deletion of pending transactions
    if (transaction.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending transactions can be deleted' 
      });
    }

    await transaction.destroy();
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction' });
  }
};

// Create purchase transaction
export const createPurchase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    const purchaseData = { 
      ...req.body, 
      shop_id: userShopId,
      type: 'purchase', 
      status: 'pending' 
    };
    const transaction = await Transaction.create(purchaseData);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ success: false, message: 'Failed to create purchase' });
  }
};

// Create credit transaction
export const createCredit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    const creditData = { 
      ...req.body, 
      shop_id: userShopId,
      type: 'credit', 
      status: 'credit' 
    };
    const transaction = await Transaction.create(creditData);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error creating credit transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to create credit transaction' });
  }
};

// Create return transaction
export const createReturn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    const returnData = { 
      ...req.body, 
      shop_id: userShopId,
      type: 'return', 
      status: 'pending' 
    };
    const transaction = await Transaction.create(returnData);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(500).json({ success: false, message: 'Failed to create return' });
  }
};

// Create bulk transactions
export const createBulkTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { transactions } = req.body;
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transactions array is required and must not be empty' 
      });
    }

    const createdTransactions = await Transaction.bulkCreate(transactions);
    res.status(201).json({ 
      success: true, 
      data: createdTransactions,
      count: createdTransactions.length 
    });
  } catch (error) {
    console.error('Error creating bulk transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to create bulk transactions' });
  }
};

// Search transactions
export const searchTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Simple search implementation - can be enhanced with full-text search
    const transactions = await Transaction.findAndCountAll({
      where: {
        // Add search conditions based on your needs
      },
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error searching transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to search transactions' });
  }
};

// Get analytics summary
export const getAnalyticsSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shop_id, date_from, date_to } = req.query;
    
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    const where: any = {
      shop_id: shop_id ? parseInt(shop_id as string) : userShopId
    };
    if (date_from && date_to) {
      where.transaction_date = {
        [Op.gte]: new Date(date_from as string),
        [Op.lte]: new Date(date_to as string)
      };
    }

    const transactions = await Transaction.findAll({ where });
    
    const summary = {
      total_transactions: transactions.length,
      total_sales: transactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0),
      total_commission: transactions.reduce((sum, t) => sum + parseFloat(t.commission_amount?.toString() || '0'), 0),
      pending_count: transactions.filter(t => t.status === 'pending').length,
      completed_count: transactions.filter(t => t.status === 'completed').length,
      credit_count: transactions.filter(t => t.status === 'credit').length
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics summary' });
  }
};

// Get daily analytics
export const getDailyAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date } = req.params;
    const { shop_id } = req.query;
    
    // Get user's shop_id
    let userShopId = req.user?.shop_id;
    if (!userShopId && req.user?.id) {
      userShopId = await getUserShopId(req.user.id);
    }
    
    if (!userShopId) {
      return res.status(400).json({ success: false, message: 'User shop not found' });
    }
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const where: any = {
      shop_id: shop_id ? parseInt(shop_id as string) : userShopId,
      transaction_date: { 
        [Op.gte]: startDate, 
        [Op.lte]: endDate 
      }
    };

    const transactions = await Transaction.findAll({ where });
    
    const analytics = {
      date,
      total_transactions: transactions.length,
      total_sales: transactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0),
      by_status: transactions.reduce((acc: any, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error getting daily analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to get daily analytics' });
  }
};

// Get monthly analytics
export const getMonthlyAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year, month } = req.params;
    const { shop_id } = req.query;
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    
    const where: any = {
      transaction_date: { 
        [Op.gte]: startDate, 
        [Op.lte]: endDate 
      }
    };
    if (shop_id) where.shop_id = shop_id;

    const transactions = await Transaction.findAll({ where });
    
    const analytics = {
      year: parseInt(year),
      month: parseInt(month),
      total_transactions: transactions.length,
      total_sales: transactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0),
      by_type: transactions.reduce((acc: any, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error getting monthly analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to get monthly analytics' });
  }
};

// Get transaction trends
export const getTransactionTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shop_id, days = 30 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));
    
    const where: any = {
      transaction_date: { 
        [Op.gte]: startDate, 
        [Op.lte]: endDate 
      }
    };
    if (shop_id) where.shop_id = shop_id;

    const transactions = await Transaction.findAll({ where, order: [['transaction_date', 'ASC']] });
    
    // Group by date
    const trends = transactions.reduce((acc: any, t) => {
      const date = t.transaction_date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0, total: 0 };
      }
      acc[date].count++;
      acc[date].total += parseFloat(t.total.toString());
      return acc;
    }, {});

    res.json({ success: true, data: Object.values(trends) });
  } catch (error) {
    console.error('Error getting transaction trends:', error);
    res.status(500).json({ success: false, message: 'Failed to get transaction trends' });
  }
};

// Export transactions to CSV
export const exportTransactionsCSV = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shop_id, date_from, date_to } = req.query;
    
    const where: any = {};
    if (shop_id) where.shop_id = shop_id;
    if (date_from && date_to) {
      where.transaction_date = {
        [Op.gte]: new Date(date_from as string),
        [Op.lte]: new Date(date_to as string)
      };
    }

    const transactions = await Transaction.findAll({ where, order: [['created_at', 'DESC']] });
    
    // Simple CSV generation - enhance as needed
    const csvHeader = 'ID,Shop ID,Farmer ID,Buyer ID,Product ID,Quantity,Price,Total,Status,Date\n';
    const csvData = transactions.map(t => 
      `${t.id},${t.shop_id},${t.farmer_id},${t.buyer_id},${t.product_id},${t.quantity},${t.price},${t.total},${t.status},${t.transaction_date}`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csvHeader + csvData);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to export transactions' });
  }
};

// Get transaction receipt
export const getTransactionReceipt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const receipt = {
      transaction_id: transaction.id,
      date: transaction.transaction_date,
      type: transaction.type,
      quantity: transaction.quantity,
      price: transaction.price,
      total: transaction.total,
      commission: transaction.commission_amount,
      status: transaction.status,
      payment_method: transaction.payment_method
    };

    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('Error getting transaction receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to get transaction receipt' });
  }
};
