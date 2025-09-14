
import { User } from '../models/user';
import { Payment } from '../models/payment';
import { Transaction } from '../models/transaction';
import { PaymentAllocation } from '../models/paymentAllocation';
import { AuditLog } from '../models/auditLog';
import { CreatePaymentDTO, PaymentResponseDTO, UpdatePaymentStatusDTO } from '../dtos';
import { Op } from 'sequelize';
import BalanceSnapshot from '../models/balanceSnapshot';




export class PaymentService {
  async createPayment(data: CreatePaymentDTO, userId: number): Promise<PaymentResponseDTO> {
    // Reject shop-to-shop payments (commission should not be a payment)
    if (data.payer_type === 'SHOP' && data.payee_type === 'SHOP') {
      throw new Error('Shop-to-shop payments (commission) are not allowed. Do not include commission as a payment.');
    }

    // Create payment record first
    const paymentData: any = { ...data, status: 'PAID' };
    if (data.transaction_id !== undefined) paymentData.transaction_id = data.transaction_id;
    else delete paymentData.transaction_id;
    
    const payment = await Payment.create(paymentData);
    if (!payment || !payment.id) {
      throw new Error('Payment creation failed: No valid payment ID returned');
    }

    // Now update user balances after payment is created
    await this.updateUserBalancesAfterPayment(payment);

    // Allocate payment to outstanding transactions for commission tracking
    await this.allocatePaymentToTransactions(payment);

    // Create audit log
    let shop_id: number | null = null;
    if (data.shop_id) {
      shop_id = data.shop_id;
    } else if (data.transaction_id) {
      const transaction = await Transaction.findByPk(data.transaction_id);
      shop_id = transaction?.shop_id || null;
    }
    
    await AuditLog.create({
      shop_id: shop_id ?? 1,
      user_id: userId,
      action: 'payment_recorded',
      entity_type: 'payment',
      entity_id: payment.id,
      new_values: JSON.stringify(payment.toJSON())
    });

    return payment.toJSON() as PaymentResponseDTO;
  }

  private async updateUserBalancesAfterPayment(payment: any): Promise<void> {
    let userIdToUpdate: number | null = null;
    let userRole: 'buyer' | 'farmer' | null = null;

    if (payment.payer_type === 'BUYER' && payment.payee_type === 'SHOP') {
      // Buyer pays shop: reduce buyer's balance (buyer owes less)
      userIdToUpdate = payment.counterparty_id;
      userRole = 'buyer';
    } else if (payment.payer_type === 'SHOP' && payment.payee_type === 'FARMER') {
      // Shop pays farmer: reduce farmer's balance (farmer is owed less)
      userIdToUpdate = payment.counterparty_id;
      userRole = 'farmer';
    }

    if (userIdToUpdate && userRole) {
      const user = await User.findByPk(userIdToUpdate);
      if (!user) throw new Error(`User with id ${userIdToUpdate} not found`);

      // Recalculate balance from all transactions and payments (including the new one)
      let newBalance = 0;
      
      if (userRole === 'farmer') {
        // Farmer: sum all farmer_earning from transactions, subtract all payments to THIS farmer
        const transactions = await Transaction.findAll({ where: { farmer_id: userIdToUpdate } });
        const totalEarning = transactions.reduce((sum, t) => sum + Number(t.farmer_earning || 0), 0);
        
        const payments = await Payment.findAll({ 
          where: { 
            payer_type: 'SHOP', 
            payee_type: 'FARMER',
            counterparty_id: userIdToUpdate,
            status: { [Op.not]: 'FAILED' } 
          } 
        });
        
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        newBalance = totalEarning - totalPaid;
        
      } else if (userRole === 'buyer') {
        // Buyer: sum all total_sale_value from transactions, subtract all payments by THIS buyer
        // Balance represents what buyer still OWES to shop
        const transactions = await Transaction.findAll({ where: { buyer_id: userIdToUpdate } });
        const totalOwed = transactions.reduce((sum, t) => sum + Number(t.total_sale_value || 0), 0);
        
        const payments = await Payment.findAll({ 
          where: { 
            payer_type: 'BUYER', 
            payee_type: 'SHOP',
            counterparty_id: userIdToUpdate,
            status: { [Op.not]: 'FAILED' } 
          } 
        });
        
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        // FIXED: Buyer balance should be what they still owe (positive = owes money, 0 = paid in full)
        newBalance = totalOwed - totalPaid;
      }

      // Round to 2 decimals and ensure non-negative balance
      newBalance = Math.round(newBalance * 100) / 100;
      if (newBalance < 0) {
        newBalance = 0; // Prevent negative balances (overpayment)
      }

      await user.update({ balance: newBalance });
      
      // Create balance snapshot with error handling
      try {
        const previousBalance = Number(user.balance || 0);
        const amountChange = newBalance - previousBalance;
        // Only create a snapshot if there is a real change in balance
        if (amountChange !== 0) {
          await BalanceSnapshot.create({
            user_id: userIdToUpdate,
            balance_type: userRole,
            previous_balance: previousBalance,
            amount_change: amountChange,
            new_balance: newBalance,
            transaction_type: 'payment',
            reference_id: payment.id,
            reference_type: 'payment',
            description: `Payment ${payment.payer_type} -> ${payment.payee_type}: ${payment.amount}`
          });
        }
      } catch (snapshotError: any) {
        console.warn(`[BALANCE SNAPSHOT WARNING] Could not create snapshot for user ${userIdToUpdate}:`, snapshotError?.message || 'Unknown error');
        // Continue without failing the payment if snapshot creation fails
      }

      console.log(`[${userRole.toUpperCase()} BALANCE UPDATE] UserID: ${userIdToUpdate}, New Balance: ${newBalance}`);
    }
  }

  private async allocatePaymentToTransactions(payment: any): Promise<void> {
    // Only allocate buyer payments to shop (these fund commission realization)
    if (payment.payer_type !== 'BUYER' || payment.payee_type !== 'SHOP') {
      return;
    }

    const buyerId = payment.counterparty_id;
    const shopId = payment.shop_id;
    const paymentAmount = Number(payment.amount || 0);

    // Get all outstanding transactions for this buyer in this shop (ordered by creation date)
    const transactions = await Transaction.findAll({
      where: {
        buyer_id: buyerId,
        shop_id: shopId,
      },
      order: [['created_at', 'ASC']]
    });

    let remainingAmount = paymentAmount;

    for (const transaction of transactions) {
      if (remainingAmount <= 0) break;

      const transactionTotal = Number(transaction.total_sale_value || 0);
      
      // Calculate how much of this transaction has already been paid
      const existingAllocations = await PaymentAllocation.findAll({
        where: { transaction_id: transaction.id }
      });
      const alreadyPaid = existingAllocations.reduce((sum, alloc) => sum + Number(alloc.allocated_amount || 0), 0);
      
      const outstandingAmount = transactionTotal - alreadyPaid;
      
      if (outstandingAmount > 0) {
        // Allocate as much as possible to this transaction
        const allocationAmount = Math.min(remainingAmount, outstandingAmount);
        
        await PaymentAllocation.create({
          payment_id: payment.id,
          transaction_id: transaction.id,
          allocated_amount: allocationAmount
        });

        remainingAmount -= allocationAmount;
        
        console.log(`[PAYMENT ALLOCATION] Payment ${payment.id} -> Transaction ${transaction.id}: ${allocationAmount}`);
      }
    }

    if (remainingAmount > 0) {
      console.log(`[PAYMENT ALLOCATION] Unallocated amount: ${remainingAmount} for payment ${payment.id}`);
    }
  }

  async createBulkPayments(data: any, userId: number): Promise<PaymentResponseDTO[]> {
    // data.payments: BulkPaymentItemDTO[]
    // Other fields: payer_type, payee_type, method, status, notes
    const results: PaymentResponseDTO[] = [];
    for (const item of data.payments) {
      const paymentData = {
        transaction_id: item.transaction_id,
        payer_type: data.payer_type,
        payee_type: data.payee_type,
        amount: item.amount,
        method: data.method,
        status: data.status,
        notes: data.notes,
      };
      const payment = await this.createPayment(paymentData, userId);
      results.push(payment);
    }
    return results;
  }

  async updatePaymentStatus(paymentId: number, data: UpdatePaymentStatusDTO, userId: number): Promise<PaymentResponseDTO | null> {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      console.error(`[updatePaymentStatus] Payment not found for id:`, paymentId);
      return null;
    }

    const oldValues = payment.toJSON();
    try {
      await payment.update({
        status: data.status,
        payment_date: data.payment_date || new Date(),
        notes: data.notes !== undefined ? data.notes : payment.notes
      });
    } catch (err) {
      console.error(`[updatePaymentStatus] Error updating payment:`, err);
      throw err;
    }


    // Fetch the related transaction to get the correct shop_id
    let shop_id = 0;
    if (payment.transaction_id != null) {
      const relatedTransaction = await Transaction.findByPk(payment.transaction_id);
      if (!relatedTransaction) throw new Error('Related transaction not found for payment audit log');
      shop_id = relatedTransaction.shop_id;
    }
    await AuditLog.create({
      shop_id,
      user_id: userId,
      action: 'payment_recorded',
      entity_type: 'payment',
      entity_id: payment.id,
      old_values: JSON.stringify(oldValues),
      new_values: JSON.stringify(payment.toJSON())
    });

    return payment.toJSON() as PaymentResponseDTO;
  }

  async getPaymentsByTransaction(transactionId: number): Promise<PaymentResponseDTO[]> {
    const payments = await Payment.findAll({
      where: { transaction_id: transactionId },
      order: [['created_at', 'DESC']]
    });

    return payments.map(p => p.toJSON() as PaymentResponseDTO);
  }

  async getOutstandingPayments(shopId?: number): Promise<any> {
    const whereClause: any = {};
    if (shopId) {
      whereClause['$transaction.shop_id$'] = shopId;
    }

    const payments = await Payment.findAll({
      where: {
        status: 'PENDING',
        ...whereClause
      },
      include: [{
        model: Transaction,
        as: 'transaction',
        attributes: ['id', 'shop_id', 'farmer_id', 'buyer_id', 'total_sale_value', 'farmer_earning']
      }],
      order: [['created_at', 'ASC']]
    });

    return payments.map(p => p.toJSON());
  }
  /**
   * Get all payments to a farmer (payee_type = 'FARMER'), with optional date filtering and aggregation
   */
  async getPaymentsToFarmer(
    farmerId: number,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{ totalPayments: number; totalPaid: number; payments: any[] }> {
    const where: any = {
      payee_type: 'FARMER',
      status: { [Op.not]: 'FAILED' }
    };
    if (options?.startDate && options?.endDate) {
      where.created_at = { [Op.between]: [options.startDate, options.endDate] };
    }
    // Join with transaction to filter by farmer_id
    const payments = await Payment.findAll({
      where,
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { farmer_id: farmerId },
        attributes: ['id', 'shop_id', 'farmer_id', 'buyer_id', 'total_sale_value', 'farmer_earning']
      }],
      order: [['created_at', 'DESC']]
    });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      totalPayments: payments.length,
      totalPaid,
      payments: payments.map(p => p.toJSON())
    };
  }

  /**
   * Get all payments by a buyer (payer_type = 'BUYER'), with optional date filtering and aggregation
   */
  async getPaymentsByBuyer(
    buyerId: number,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{ totalPayments: number; totalPaid: number; payments: any[] }> {
    const where: any = {
      payer_type: 'BUYER',
      status: { [Op.not]: 'FAILED' }
    };
    if (options?.startDate && options?.endDate) {
      where.created_at = { [Op.between]: [options.startDate, options.endDate] };
    }
    // Join with transaction to filter by buyer_id
    const payments = await Payment.findAll({
      where,
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { buyer_id: buyerId },
        attributes: ['id', 'shop_id', 'farmer_id', 'buyer_id', 'total_sale_value', 'farmer_earning']
      }],
      order: [['created_at', 'DESC']]
    });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      totalPayments: payments.length,
      totalPaid,
      payments: payments.map(p => p.toJSON())
    };
  }
}