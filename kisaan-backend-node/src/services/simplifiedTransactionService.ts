import { User } from '../models/user';
import { Transaction } from '../models/transaction';
import { Settlement } from '../models/settlement';
import { Payment } from '../models/payment';
// import sequelize from '../config/database';
import { TRANSACTION_STATUS } from '../shared/constants';

/**
 * SIMPLIFIED TRANSACTION & BALANCE SERVICE
 * 
 * Clear user story:
 * 1. Transaction creates -> farmer gets positive balance (shop owes farmer)
 *                        -> buyer gets negative balance (buyer owes shop)
 * 2. Payments reduce user balances toward zero
 * 3. Expenses/advances affect user balances clearly
 */

export class SimplifiedTransactionService {
  
  /**
   * Create transaction with simple balance logic
   */
  async createSimpleTransaction(data: {
    shop_id: number;
    farmer_id: number;
    buyer_id: number;
    category_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    commission_rate?: number;
    transaction_date?: Date;
    notes?: string;
    payments?: Array<{
      payer_type: 'BUYER' | 'SHOP';
      payee_type: 'SHOP' | 'FARMER';
      amount: number;
      method: string;
      status?: string;
      payment_date?: string;
      notes?: string;
    }>;
  }): Promise<{ transaction: Transaction; payments: Payment[]; balance_updates: { farmer: { old_balance: number; new_balance: number } } }> {
    
    // Calculate amounts
    const total_amount = data.quantity * data.unit_price;
    const commission_rate = data.commission_rate || 5; // Default 5%
    const commission_amount = (total_amount * commission_rate) / 100;
    const farmer_earning = total_amount - commission_amount;
    
    // Create transaction record
    const transaction = await Transaction.create({
      shop_id: data.shop_id,
      farmer_id: data.farmer_id,
      buyer_id: data.buyer_id,
      category_id: data.category_id,
      product_name: data.product_name,
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_amount,
      commission_amount,
      farmer_earning,
      commission_rate,
      status: TRANSACTION_STATUS.PENDING,
      transaction_date: data.transaction_date || new Date()
    });
    
    // SIMPLIFIED BALANCE UPDATE
    // Farmer: +farmer_earning (shop owes farmer this amount)
    await this.updateBalance(data.farmer_id, farmer_earning, 'add');
    
    // Buyer: -total_amount (buyer owes shop this amount) 
    await this.updateBalance(data.buyer_id, total_amount, 'subtract');
    
    // Create payments if provided
  const createdPayments: Payment[] = [];
    if (data.payments && Array.isArray(data.payments)) {
      for (const payment of data.payments) {
        const paymentRecord = await Payment.create({
          transaction_id: transaction.id,
          payer_type: payment.payer_type,
          payee_type: payment.payee_type,
          amount: payment.amount,
          method: (payment.method as 'CASH' | 'BANK' | 'UPI' | 'OTHER') || 'CASH',
          status: (payment.status as 'PAID' | 'PENDING' | 'FAILED') || 'PAID',
          payment_date: payment.payment_date ? new Date(payment.payment_date) : new Date(),
          notes: payment.notes || '',
          counterparty_id: payment.payer_type === 'BUYER' ? data.buyer_id : data.farmer_id
        });
        createdPayments.push(paymentRecord);
      }
    }
    
    return {
      transaction,
      payments: createdPayments,
      balance_updates: {
        farmer: { old_balance: 0, new_balance: farmer_earning } // Simplified for now
      }
    };
  }
  
  /**
   * Record payment - reduces user balance toward zero
   */
  async recordPayment(data: {
    user_id: number;
    amount: number;
    payment_type: 'farmer_payment' | 'buyer_payment';
    notes?: string;
  }): Promise<Payment> {
    
    // Create payment record
    const payment = await Payment.create({
      transaction_id: null, // Not tied to specific transaction
      payer_type: data.payment_type === 'buyer_payment' ? 'BUYER' : 'SHOP',
      payee_type: data.payment_type === 'buyer_payment' ? 'SHOP' : 'FARMER', 
      amount: data.amount,
      status: 'PAID',
      method: 'CASH',
      notes: data.notes || '',
      counterparty_id: data.user_id
    });
    
    // Update balance based on payment type
    if (data.payment_type === 'farmer_payment') {
      // Shop pays farmer -> reduces farmer's positive balance
      await this.updateBalance(data.user_id, data.amount, 'subtract');
    } else {
      // Buyer pays shop -> reduces buyer's negative balance (brings toward 0)
      await this.updateBalance(data.user_id, data.amount, 'add');
    }
    
    return payment;
  }
  
  /**
   * Record expense/advance - affects user balance
   */
  async recordExpense(data: {
    user_id: number;
    amount: number;
    expense_type: 'shop_expense' | 'user_advance';
    description: string;
    shop_id: number;
  }): Promise<Settlement> {
    
    if (data.expense_type === 'shop_expense') {
      // Shop business expense - doesn't affect user balances
      // Just track for shop accounting
      return await Settlement.create({
        shop_id: data.shop_id,
        user_id: data.user_id, // Owner's ID
        amount: data.amount,
        reason: 'adjustment',
        status: 'settled' // Shop expenses are immediately settled
      });
      
    } else {
      // User advance - reduces user's balance (they owe less or shop owes less)
      await this.updateBalance(data.user_id, data.amount, 'subtract');
      
      return await Settlement.create({
        shop_id: data.shop_id,
        user_id: data.user_id,
        amount: data.amount,
        reason: 'adjustment',
        status: 'settled'
      });
    }
  }
  
  /**
   * Simple balance update helper
   */
  private async updateBalance(userId: number, amount: number, operation: 'add' | 'subtract'): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    
    const currentBalance = parseFloat(user.balance?.toString() || '0');
    const newBalance = operation === 'add' 
      ? currentBalance + amount 
      : currentBalance - amount;
    
    await user.update({ balance: newBalance });
  }
  
  /**
   * Get user balance with clear explanation
   */
  async getUserBalanceInfo(userId: number): Promise<{
    user_id: number;
    username: string;
    role: string;
    balance: number;
    balance_meaning: string;
  }> {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    
    const balance = parseFloat(user.balance?.toString() || '0');
    
    return {
      user_id: userId,
      username: user.username,
      role: user.role,
      balance: balance,
      balance_meaning: balance > 0 
        ? `Shop owes ${user.username} ₹${Math.abs(balance)}`
        : balance < 0 
        ? `${user.username} owes shop ₹${Math.abs(balance)}`
        : `${user.username} has no pending balance`
    };
  }
}