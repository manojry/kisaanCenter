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
  farmer_id?: string,
  status?: string,
  include_analytics?: string,
  owner_id?: string
}) => {
  try {
    const where: any = {};

    // shop_id is now required - it should be validated in the controller
    if (!filters.shop_id || filters.shop_id.trim() === '' || filters.shop_id === 'undefined') {
      throw new Error('shop_id is required for transaction queries');
    }

    where.shop_id = parseInt(filters.shop_id);

    // Only add date range if both dates are provided
    if (filters.date_from && filters.date_to && 
        filters.date_from.trim() !== '' && filters.date_to.trim() !== '' &&
        filters.date_from !== 'undefined' && filters.date_to !== 'undefined') {
      where.transaction_date = {
        [Op.gte]: new Date(filters.date_from + 'T00:00:00.000Z'),
        [Op.lte]: new Date(filters.date_to + 'T23:59:59.999Z')
      };
    }

    // Add buyer_id filter if provided
    if (filters.buyer_id && filters.buyer_id.trim() !== '' && filters.buyer_id !== 'undefined') {
      where.buyer_id = filters.buyer_id;
    }

    // Add farmer_id filter if provided
    if (filters.farmer_id && filters.farmer_id.trim() !== '' && filters.farmer_id !== 'undefined') {
      where.farmer_id = filters.farmer_id;
    }

    // Add status filter if provided
    if (filters.status && filters.status.trim() !== '' && filters.status !== 'undefined') {
      where.status = filters.status;
    }

  // ...removed log: Transaction query filters...

    const { User } = await import('../models/user');
    const { Product } = await import('../models/product');
    const { Category } = await import('../models/category');

    const transactions = await Transaction.findAll({
      where,
      order: [['transaction_date', 'DESC']],
      include: [
        { 
          model: User, 
          as: 'buyer', 
          attributes: ['id', 'username', 'role'],
          required: false
        },
        { 
          model: Product, 
          as: 'product', 
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    // Map to DTO with flat fields for frontend
    const transactionDTOs = await Promise.all(transactions.map(async (t: any) => {
      let buyerName = `Buyer ${t.buyer_id}`;
      let productName = `Product ${t.product_id}`;
      let farmerName = t.farmer_id || 'Unknown Farmer';
      
      try {
        if (t.buyer) {
          buyerName = t.buyer.username;
        } else {
          const buyer = await User.findOne({ where: { id: t.buyer_id } });
          if (buyer) {
            buyerName = buyer.username;
          } else {
           
          }
        }
        
        if (t.product) {
          productName = t.product.name;
        } else {
          const product = await Product.findOne({ where: { id: t.product_id } });
          if (product) productName = product.name;
        }
        
        if (t.farmer_id) {
          const farmer = await User.findOne({ where: { id: t.farmer_id } });
          if (farmer) farmerName = farmer.username;
        }
      } catch (error) {
      }
      
      return {
        id: t.id,
        shop_id: t.shop_id,
        farmer_id: t.farmer_id || null,
        farmer_name: farmerName,
        buyer_id: t.buyer_id,
        buyer_name: buyerName,
        product_id: t.product_id,
        product_name: productName,
        quantity: t.quantity,
        price: parseFloat(t.price || 0),
        total: parseFloat(t.total || 0),
        commission_rate: parseFloat(t.commission_rate || 10),
        commission_amount: parseFloat(t.commission_amount || 0),
        farmer_paid: parseFloat(t.farmer_paid || 0),
        buyer_paid: parseFloat(t.buyer_paid || 0),
        deficit: parseFloat(t.deficit || 0),
        status: t.status,
        transaction_date: t.transaction_date
      };
    }));

    // Calculate analytics if requested
    let analytics = null;
    if (filters.include_analytics === 'true') {
      const totalSales = transactionDTOs.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0);
      const totalCommission = transactionDTOs.reduce((sum, t) => sum + parseFloat(t.commission_amount.toString()), 0);
      const totalDeficit = transactionDTOs.reduce((sum, t) => sum + parseFloat(t.deficit.toString()), 0);
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
        total_sales: totalSales,
        total_commission: totalCommission,
        total_deficit: totalDeficit,
        status_summary: statusSummary,
        income_by_status: incomeByStatus,
        date_range: filters.date_from && filters.date_to ? {
          from: filters.date_from,
          to: filters.date_to
        } : null
      };
    }
  // ...removed log: Sample transaction DTO...
    return { transactions: transactionDTOs, analytics };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error; // Re-throw the error instead of returning empty array
  }
}

export const createTransaction = async (data: any) => {
  // Accept both farmer_id and seller_id for compatibility
  const input = { ...data };
  if (!input.farmer_id && input.seller_id) {
    input.farmer_id = input.seller_id;
  }

  // Debug log input
  console.log('createTransaction called with input:', input);

  // Try validation first, but handle failure gracefully
  const validationResult = TransactionSchema.safeParse(input);
  let validated;
  
  if (validationResult.success) {
    validated = validationResult.data;
    console.log('✅ Schema validation successful');
  } else {
    console.log('❌ Schema validation failed:', validationResult.error.issues);
    // Use input directly but ensure proper type conversion
    validated = {
      ...input,
      shop_id: parseInt(input.shop_id),
      farmer_id: input.farmer_id?.toString(),
      buyer_id: input.buyer_id?.toString(),
      product_id: parseInt(input.product_id),
      quantity: parseInt(input.quantity),
      price: parseFloat(input.price),
      total: input.total ? parseFloat(input.total) : undefined,
      commission_rate: input.commission_rate ? parseFloat(input.commission_rate) : undefined,
      commission_amount: input.commission_amount ? parseFloat(input.commission_amount) : undefined,
      farmer_paid: input.farmer_paid ? parseFloat(input.farmer_paid) : 0,
      buyer_paid: input.buyer_paid ? parseFloat(input.buyer_paid) : 0,
    };
  }
  
  console.log('Validated transaction input:', validated);

  // Ensure farmer_id is not null or undefined
  if (!validated.farmer_id) {
    throw new Error('farmer_id is required and cannot be null or undefined');
  }

  // Get commission rate from shop (default 10% if not found)
  let commission_rate = validated.commission_rate || 10.0;
  try {
    const shop = await Shop.findByPk(validated.shop_id);
    if (shop && shop.commission_rate) {
      commission_rate = shop.commission_rate;
    }
  } catch (error) {
    console.log('Could not fetch shop commission rate, using default', error);
  }

  // Calculate amounts
  const total = validated.total || validated.price * validated.quantity;
  const commission_amount = validated.commission_amount || (total * commission_rate / 100);
  const farmer_paid = validated.farmer_paid || 0;
  const buyer_paid = validated.buyer_paid || 0;
  const deficit = total - buyer_paid;

  // Calculate status based on transaction logic
  let status = validated.status;
  if (!status) {
    const farmer_should_get = total - commission_amount;
    if (buyer_paid === 0) {
      status = 'credit';
    } else if (buyer_paid === total && farmer_paid >= farmer_should_get) {
      status = 'paid';
    } else if (buyer_paid === total && farmer_paid < farmer_should_get) {
      status = 'farmer_due';
    } else if (buyer_paid > 0 && buyer_paid < total) {
      status = 'partial';
    } else {
      status = 'pending';
    }
  }

  // Debug log calculated values
  console.log('Transaction calculated values:', {
    total,
    commission_rate,
    commission_amount,
    farmer_paid,
    buyer_paid,
    deficit,
    status,
    farmer_id_final: validated.farmer_id
  });

  try {
    // Create transaction
    const transaction = await Transaction.create({
      shop_id: validated.shop_id,
      farmer_id: validated.farmer_id,
      buyer_id: validated.buyer_id,
      product_id: validated.product_id,
      quantity: validated.quantity,
      price: validated.price,
      transaction_date: validated.transaction_date ? new Date(validated.transaction_date) : new Date(),
      total,
      commission_rate,
      commission_amount,
      farmer_paid,
      buyer_paid,
      deficit,
      status,
    });
    console.log('Transaction created successfully:', transaction?.id);
    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

  // TODO: Implement get transaction by id

