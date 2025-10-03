
import { User } from '../models/user';
import { Payment } from '../models/payment';
import { Transaction } from '../models/transaction';
import { PaymentAllocation } from '../models/paymentAllocation';
import { logger } from '../shared/logging/logger';
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
  const paymentData: CreatePaymentDTO = { ...data, status: 'PAID' };
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

  private async updateUserBalancesAfterPayment(payment: Payment): Promise<void> {
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

      // Capture previous balance BEFORE update
      const previousBalance = Number(user.balance || 0);


      let newBalance = previousBalance;
      const paymentAmount = Number(payment.amount);
      if (userRole === 'farmer') {
        // Subtract payment from farmer's balance (pending amount)
        newBalance = previousBalance - paymentAmount;
      } else if (userRole === 'buyer') {
        // Subtract payment from buyer's balance (pending amount)
        newBalance = previousBalance - paymentAmount;
      }
      newBalance = Math.round(newBalance * 100) / 100;
      if (newBalance < 0) {
        newBalance = 0;
      }

      await user.update({ balance: newBalance });

      // Create balance snapshot with error handling
      try {
        const amountChange = newBalance - previousBalance;
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
      }

      console.log(`[${userRole.toUpperCase()} BALANCE UPDATE] UserID: ${userIdToUpdate}, New Balance: ${newBalance}`);
    }
  }

  private async allocatePaymentToTransactions(payment: Payment): Promise<void> {
    // Only allocate buyer payments to shop (these fund commission realization)
    if (payment.payer_type !== 'BUYER' || payment.payee_type !== 'SHOP') {
      return;
    }

    const buyerId = payment.counterparty_id;
    const shopId = payment.shop_id;
    const paymentAmount = Number(payment.amount || 0);

    console.log('[ALLOCATE] start', { paymentId: payment.id, buyerId, shopId, paymentAmount, txRef: payment.transaction_id });

    // Get all outstanding transactions for this buyer in this shop (ordered by creation date)
    const whereClause: Record<string, number> = {};
    if (typeof buyerId === 'number') whereClause.buyer_id = buyerId;
    if (typeof shopId === 'number') whereClause.shop_id = shopId;
    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [['created_at', 'ASC']]
    });

    if (!transactions.length) {
      console.log('[ALLOCATE] No transactions found for buyer/shop criteria. Skipping distribution.', { buyerId, shopId });
    }

    let remainingAmount = paymentAmount;

    // Fast-path: if payment references a specific transaction_id ensure at least that transaction gets allocation
    if (payment.transaction_id) {
      try {
        const targetTx = await Transaction.findByPk(payment.transaction_id);
        if (targetTx) {
          const transactionTotal = Number((targetTx as Transaction).total_amount || 0);
          const existingAllocations = await PaymentAllocation.findAll({ where: { transaction_id: targetTx.id } });
          const alreadyPaid = existingAllocations.reduce((sum, alloc) => sum + Number(alloc.allocated_amount || 0), 0);
          const outstandingAmount = Math.max(transactionTotal - alreadyPaid, 0);
          if (outstandingAmount > 0) {
            const allocationAmount = Math.min(remainingAmount, outstandingAmount);
            if (allocationAmount > 0) {
              await PaymentAllocation.create({ payment_id: payment.id, transaction_id: targetTx.id, allocated_amount: allocationAmount });
              remainingAmount -= allocationAmount;
              console.log('[ALLOCATE] Direct allocation via payment.transaction_id', { paymentId: payment.id, transactionId: targetTx.id, allocationAmount, remainingAfter: remainingAmount });
            }
          } else {
            console.log('[ALLOCATE] Target transaction already fully allocated', { transactionId: targetTx.id, alreadyPaid, transactionTotal });
          }
        } else {
          console.log('[ALLOCATE] Referenced transaction_id not found', { transaction_id: payment.transaction_id });
        }
      } catch (directErr: any) {
        console.warn('[ALLOCATE] Direct allocation error', directErr?.message || directErr);
      }
    }

    for (const transaction of transactions) {
      if (remainingAmount <= 0) break;

      // Skip if we already directly allocated full payment to this transaction
      if (payment.transaction_id && Number(payment.transaction_id) === Number(transaction.id)) {
        continue;
      }

  const transactionTotal = Number((transaction as Transaction).total_amount || 0);
      
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

  async createBulkPayments(data: import('../dtos/PaymentDTO').BulkPaymentDTO, userId: number): Promise<PaymentResponseDTO[]> {
    const results: PaymentResponseDTO[] = [];
    for (const item of data.payments) {
      const paymentData: CreatePaymentDTO = {
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
      logger.error({ paymentId }, '[updatePaymentStatus] Payment not found');
      return null;
    }

    const oldValues = payment.toJSON();
    try {
      await payment.update({
        status: data.status,
        payment_date: data.payment_date || new Date(),
        notes: data.notes !== undefined ? data.notes : payment.notes
      });
    } catch (err: any) {
      logger.error({ err, paymentId }, '[updatePaymentStatus] Error updating payment');
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

  async getOutstandingPayments(shopId?: number): Promise<PaymentResponseDTO[]> {
    const whereClause: Record<string, unknown> = {};
    let transactionInclude: any = {
      model: Transaction,
      as: 'transaction',
      attributes: ['id', 'shop_id', 'farmer_id', 'buyer_id', 'total_amount', 'farmer_earning']
    };
    if (shopId) {
      transactionInclude.where = { shop_id: shopId };
    }
    const payments = await Payment.findAll({
      where: {
        status: 'PENDING',
      },
      include: [transactionInclude],
      order: [['created_at', 'ASC']]
    });
    return payments.map(p => p.toJSON() as PaymentResponseDTO);
  }
  /**
   * Get all payments to a farmer (payee_type = 'FARMER'), with optional date filtering and aggregation
   */
  async getPaymentsToFarmer(
    farmerId: number,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{ totalPayments: number; totalPaid: number; payments: PaymentResponseDTO[] }> {
    const where: Record<string, unknown> = {
      payee_type: 'FARMER',
      status: { [Op.not]: 'FAILED' }
    };
    if (options?.startDate && options?.endDate) {
      where.created_at = { [Op.between]: [options.startDate, options.endDate] };
    }
    const payments = await Payment.findAll({
      where,
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { farmer_id: farmerId },
        attributes: ['id', 'shop_id', 'farmer_id', 'buyer_id', 'total_amount', 'farmer_earning']
      }],
      order: [['created_at', 'DESC']]
    });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      totalPayments: payments.length,
      totalPaid,
      payments: payments.map(p => p.toJSON() as PaymentResponseDTO)
    };
  }

  /**
   * Get all payments by a buyer (payer_type = 'BUYER'), with optional date filtering and aggregation
   */
  async getPaymentsByBuyer(
    buyerId: number,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{ totalPayments: number; totalPaid: number; payments: PaymentResponseDTO[] }> {
    const where: Record<string, unknown> = {
      payer_type: 'BUYER',
      status: { [Op.not]: 'FAILED' }
    };
    if (options?.startDate && options?.endDate) {
      where.created_at = { [Op.between]: [options.startDate, options.endDate] };
    }
    const payments = await Payment.findAll({
      where,
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { buyer_id: buyerId },
        attributes: ['id', 'shop_id', 'farmer_id', 'buyer_id', 'total_amount', 'farmer_earning']
      }],
      order: [['created_at', 'DESC']]
    });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      totalPayments: payments.length,
      totalPaid,
      payments: payments.map(p => p.toJSON() as PaymentResponseDTO)
    };
  }
}