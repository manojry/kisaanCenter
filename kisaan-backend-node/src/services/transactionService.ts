import { Transaction } from '../models/transaction';
import { Shop } from '../models/shop';
import { User } from '../models/user';
import { Category } from '../models/category';
import { Commission } from '../models/commission';
import { Payment } from '../models/payment';
import { PaymentService } from './paymentService';
import { AuditLog } from '../models/auditLog';
import { Op } from 'sequelize';
import { CreateTransactionDTO, TransactionResponseDTO, TransactionSummaryDTO } from '../dtos';
import BalanceSnapshot from '../models/balanceSnapshot';

export class TransactionService {
  /**
   * Get all transactions for a buyer, with optional date filtering and aggregation
   */
  async getTransactionsByBuyer(buyerId: number, filters?: { startDate?: Date; endDate?: Date }): Promise<TransactionResponseDTO[]> {
    const where: any = { buyer_id: buyerId };
    if (filters?.startDate && filters?.endDate) {
      where.created_at = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }
    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: User, as: 'farmer' },
        { model: User, as: 'buyer' },
        { model: Category, as: 'category' }
      ],
      order: [['created_at', 'DESC']]
    });
    return transactions.map(t => t.toJSON() as TransactionResponseDTO);
  }
  async createTransaction(data: CreateTransactionDTO, userId: number): Promise<TransactionResponseDTO> {
    // Defensive: Validate all referenced entities exist
    const shop = await Shop.findByPk(data.shop_id);
    if (!shop) throw new Error(`Shop with id ${data.shop_id} does not exist`);
    const farmer = await User.findByPk(data.farmer_id);
    if (!farmer) throw new Error(`Farmer with id ${data.farmer_id} does not exist`);
    const buyer = await User.findByPk(data.buyer_id);
    if (!buyer) throw new Error(`Buyer with id ${data.buyer_id} does not exist`);
    const category = await Category.findByPk(data.category_id);
    if (!category) throw new Error(`Category with id ${data.category_id} does not exist`);

    // Get shop commission rate
    const commission = await Commission.findOne({ 
      where: { shop_id: data.shop_id },
      order: [['created_at', 'DESC']]
    });
    const commissionRate = commission?.rate || 10;
    const totalSaleValue = data.quantity * data.unit_price;
    const shopCommission = (totalSaleValue * commissionRate) / 100;
    const farmerEarning = totalSaleValue - shopCommission;

    // Remove payments from transaction fields
    const { payments, ...transactionFields } = data;

    const transaction = await Transaction.create({
      ...transactionFields,
      total_sale_value: totalSaleValue,
      shop_commission: shopCommission,
      farmer_earning: farmerEarning
    });

    if (!transaction || !transaction.id) {
      throw new Error('Transaction creation failed: No valid transaction ID returned');
    }


    // Create associated payments using PaymentService if provided, but skip shop-to-shop (commission) payments
    if (Array.isArray(payments) && payments.length > 0) {
      const paymentService = new PaymentService();
      const filteredPayments = payments.filter(
        (p) => !(p.payer_type === 'SHOP' && p.payee_type === 'SHOP')
      );
      for (const payment of filteredPayments) {
        await paymentService.createPayment({ ...payment, transaction_id: transaction.id }, userId);
      }
    }




    // Update cumulative_value only (not balance) on transaction creation
  await farmer.update({ cumulative_value: farmerEarning + Number(farmer.cumulative_value) });
  await buyer.update({ cumulative_value: totalSaleValue + Number(buyer.cumulative_value) });

  // Calculate initial payments (if any) for this transaction
  let initialFarmerPaid = 0;
  let initialBuyerPaid = 0;
  if (Array.isArray(payments) && payments.length > 0) {
    // Ensure counterparty_id is set for buyer payments
    payments.forEach((p) => {
      if (p.payer_type === 'BUYER' && p.payee_type === 'SHOP' && !p.counterparty_id) {
        p.counterparty_id = buyer.id;
      }
      if (p.payer_type === 'SHOP' && p.payee_type === 'FARMER' && !p.counterparty_id) {
        p.counterparty_id = farmer.id;
      }
    });
    initialFarmerPaid = payments
      .filter((p) => p.payer_type === 'SHOP' && p.payee_type === 'FARMER' && p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    initialBuyerPaid = payments
      .filter((p) => p.payer_type === 'BUYER' && p.payee_type === 'SHOP' && p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }
  // Always add pending amount to buyer balance if not fully paid
  const buyerPending = Math.max(0, totalSaleValue - initialBuyerPaid);
  if (buyerPending > 0) {
    await buyer.update({ balance: Number(buyer.balance || 0) + buyerPending });
    console.log(`[TRANSACTION BALANCE UPDATE] Transaction ${transaction.id}: Buyer pending added: ${buyerPending}, Buyer initial paid: ${initialBuyerPaid}`);
  } else {
    console.log(`[TRANSACTION BALANCE UPDATE] Transaction ${transaction.id}: Buyer paid in full, no pending added. Buyer initial paid: ${initialBuyerPaid}`);
  }
  // Farmer logic unchanged
  const farmerPending = Math.max(0, farmerEarning - initialFarmerPaid);
  if (farmerPending > 0) {
    await farmer.update({ balance: Number(farmer.balance || 0) + farmerPending });
    console.log(`[TRANSACTION BALANCE UPDATE] Transaction ${transaction.id}: Farmer pending added: ${farmerPending}, Farmer initial paid: ${initialFarmerPaid}`);
  } else {
    console.log(`[TRANSACTION BALANCE UPDATE] Transaction ${transaction.id}: Farmer paid in full, no pending added. Farmer initial paid: ${initialFarmerPaid}`);
  }
  // Removed recalculateUserBalance to preserve running balance sheet model

    // Owner/shop cumulative_value increases by commission (if owner exists)
    if (shop && shop.owner_id) {
      await User.increment({ cumulative_value: shopCommission }, { where: { id: shop.owner_id } });
    }

    // Create audit log
    await AuditLog.create({
      shop_id: data.shop_id,
      user_id: userId || 1, // Default to 1 if userId is null
      action: 'transaction_created',
      entity_type: 'transaction',
      entity_id: transaction.id,
      new_values: JSON.stringify(transaction.toJSON())
    });

    // Fetch the transaction with payments included for response
    const transactionWithPayments = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Payment, as: 'payments' }
      ]
    });
    return transactionWithPayments ? transactionWithPayments.toJSON() as TransactionResponseDTO : transaction.toJSON() as TransactionResponseDTO;
  }
  async getTransactionById(id: number): Promise<TransactionResponseDTO | null> {
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: Shop, as: 'transactionShop' },
        { model: User, as: 'farmer' },
        { model: User, as: 'buyer' },
        { model: Category, as: 'category' },
        { model: Payment, as: 'payments' }
      ]
    });
    if (!transaction) return null;
    const tObj: any = transaction.toJSON();
    // Defensive: ensure payments is always an array of PaymentResponseDTO
    tObj.payments = Array.isArray(tObj.payments) ? tObj.payments : [];
    return tObj as TransactionResponseDTO;
  }
  async getTransactionsByShop(shopId: number, filters?: {
    startDate?: Date;
    endDate?: Date;
    farmerId?: number;
    buyerId?: number;
  }): Promise<TransactionResponseDTO[]> {
    const where: any = { shop_id: shopId };
    
    // If date filters are present, convert local IST date range to UTC for filtering
    if (filters?.startDate && filters?.endDate) {
      // Assume filters.startDate and filters.endDate are local (IST) dates at 00:00:00 and 23:59:59.999
      // Convert to UTC: IST - 5:30 = UTC
      const toUTC = (date: Date) => {
        // Subtract 5 hours 30 minutes
        return new Date(date.getTime() - (5.5 * 60 * 60 * 1000));
      };
      const startUTC = toUTC(filters.startDate);
      // For end, add 1 day minus 1 ms, then convert to UTC
      const endLocal = new Date(filters.endDate.getTime());
      endLocal.setHours(23, 59, 59, 999);
      const endUTC = toUTC(endLocal);
      where.created_at = {
        [Op.between]: [startUTC, endUTC]
      };
    }
    
    if (filters?.farmerId) where.farmer_id = filters.farmerId;
    if (filters?.buyerId) where.buyer_id = filters.buyerId;

    // Fetch transactions and their payments
    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: User, as: 'farmer' },
        { model: User, as: 'buyer' },
        { model: Category, as: 'category' },
        { model: Payment, as: 'payments' }
      ],
      order: [['created_at', 'DESC']]
    });

    // Map transactions to include buyer and farmer balances for dashboard
    return transactions.map((t: any) => {
      const tx = t.toJSON();
      const total = Number(tx.total_sale_value);
      const commission = Number(tx.shop_commission);
      // Buyer payments
      const buyerPayments = Array.isArray(tx.payments)
        ? tx.payments.filter((p: any) => p.payer_type === 'BUYER' && p.payee_type === 'SHOP' && p.status === 'PAID')
        : [];
      const buyer_paid = buyerPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      // Farmer payments
      const farmer_earning = Number(tx.farmer_earning);
      const farmerPayments = Array.isArray(tx.payments)
        ? tx.payments.filter((p: any) => p.payer_type === 'SHOP' && p.payee_type === 'FARMER' && p.status === 'PAID')
        : [];
      const farmer_paid = farmerPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      // To collect from buyer
      const deficit = Math.max(0, total - buyer_paid);
  // To pay to farmer: always what is owed, regardless of buyer payment
  const farmer_due = Math.max(0, farmer_earning - farmer_paid);
      return {
        ...tx,
        total,
        buyer_paid,
        farmer_paid,
        deficit,      // what buyer owes shop
        farmer_due    // what shop owes farmer (capped by buyer_paid - commission)
      };
    });
  }

  async getShopEarnings(shopId: number, period?: { start: Date; end: Date }): Promise<TransactionSummaryDTO> {
    const where: any = { shop_id: shopId };
    
    if (period) {
      where.created_at = {
        [Op.between]: [period.start, period.end]
      };
    }

    const transactions = await Transaction.findAll({ where });
    
    return {
      total_transactions: transactions.length,
      total_sales: transactions.reduce((sum, t) => sum + Number(t.total_sale_value), 0),
      total_commission: transactions.reduce((sum, t) => sum + Number(t.shop_commission), 0),
      total_farmer_earnings: transactions.reduce((sum, t) => sum + Number(t.farmer_earning), 0)
    };
  }
  async getFarmerEarnings(farmerId: number, shopId?: number, period?: { start: Date; end: Date }) {
    const where: any = { farmer_id: farmerId };
    
    if (shopId) where.shop_id = shopId;
    if (period) {
      where.created_at = {
        [Op.between]: [period.start, period.end]
      };
    }

    const transactions = await Transaction.findAll({ where });
    
    return {
      totalTransactions: transactions.length,
      totalEarnings: transactions.reduce((sum, t) => sum + Number(t.farmer_earning), 0),
      transactions: transactions.map(t => t.toJSON() as TransactionResponseDTO)
    };
  }

  /**
   * Recalculate user balance based on all their transactions and payments
   * This ensures consistency with PaymentService calculations
   */
  private async recalculateUserBalance(userId: number, userRole: 'farmer' | 'buyer'): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User with id ${userId} not found`);

    let newBalance = 0;
    
    if (userRole === 'farmer') {
      // Farmer: for each transaction, only count as due the minimum of (farmer_earning, buyer_paid - commission) minus what has already been paid to the farmer
      const transactions = await Transaction.findAll({ where: { farmer_id: userId } });
      let totalDue = 0;
      for (const t of transactions) {
        const total = Number(t.total_sale_value || 0);
        const commission = Number(t.shop_commission || 0);
        const farmer_earning = Number(t.farmer_earning || 0);
        // Fetch payments for this transaction
        const payments = await Payment.findAll({ where: { transaction_id: t.id, status: { [Op.not]: 'FAILED' } } });
        // Buyer payments for this transaction
        const buyer_paid = payments.filter((p: any) => p.payer_type === 'BUYER' && p.payee_type === 'SHOP' && p.status === 'PAID')
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        // Farmer payments for this transaction
        const farmer_paid = payments.filter((p: any) => p.payer_type === 'SHOP' && p.payee_type === 'FARMER' && p.status === 'PAID')
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        
        // Farmer is owed their full earning minus what they've been paid
        // Commission tracking is separate from what farmer is owed
        const dueForThisTx = Math.max(0, farmer_earning - farmer_paid);
        totalDue += dueForThisTx;
      }
      newBalance = Math.round(totalDue * 100) / 100;
    } else if (userRole === 'buyer') {
      // Buyer: sum all total_sale_value from transactions, subtract all payments by THIS buyer
      // Balance represents what buyer still OWES to shop
      const transactions = await Transaction.findAll({ where: { buyer_id: userId } });
      const totalOwed = transactions.reduce((sum, t) => sum + Number(t.total_sale_value || 0), 0);
      
      const payments = await Payment.findAll({ 
        where: { 
          payer_type: 'BUYER', 
          payee_type: 'SHOP',
          counterparty_id: userId,
          status: { [Op.not]: 'FAILED' } 
        } 
      });
      
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      // Buyer balance should be what they still owe (positive = owes money, 0 = paid in full)
      newBalance = totalOwed - totalPaid;
    }

    // Round to 2 decimals and ensure non-negative balance
    newBalance = Math.round(newBalance * 100) / 100;
    if (newBalance < 0) {
      newBalance = 0; // Prevent negative balances (overpayment)
    }

    await user.update({ balance: newBalance });
    
    console.log(`[${userRole.toUpperCase()} BALANCE RECALC] UserID: ${userId}, New Balance: ${newBalance}`);
  }
}