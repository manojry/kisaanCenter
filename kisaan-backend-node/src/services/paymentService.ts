import { User } from '../models/user';
import { Payment } from '../models/payment';
import { Transaction } from '../models/transaction';
import { PaymentAllocation } from '../models/paymentAllocation';
import { logger } from '../shared/logging/logger';
import { AuditLog } from '../models/auditLog';
import { CreatePaymentDTO, PaymentResponseDTO, UpdatePaymentStatusDTO } from '../dtos';
import { Op } from 'sequelize';
import { PARTY_TYPE } from '../shared/partyTypes';
import BalanceSnapshot from '../models/balanceSnapshot';
import { TransactionService } from './transactionService';



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
    console.log('[PAYMENT] Creating payment', paymentData);
    const payment = await Payment.create(paymentData);
    if (!payment || !payment.id) {
      console.error('[PAYMENT] Payment creation failed: No valid payment ID returned', paymentData);
      throw new Error('Payment creation failed: No valid payment ID returned');
    }
    console.log('[PAYMENT] Created payment', payment.toJSON());

    // Now update user balances after payment is created
    await this.updateUserBalancesAfterPayment(payment);

    // Always allocate payment to its transaction
    if (payment.transaction_id) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // const { PaymentAllocation } = require('../models/paymentAllocation');
  // Use import for PaymentAllocation
  // import { PaymentAllocation } from '../models/paymentAllocation';
  const PaymentAllocation = (await import('../models/paymentAllocation')).PaymentAllocation;
      await PaymentAllocation.create({
        payment_id: payment.id,
        transaction_id: payment.transaction_id,
        allocated_amount: payment.amount
      });
      console.log('[PAYMENT] Allocated payment to transaction', { paymentId: payment.id, transactionId: payment.transaction_id, amount: payment.amount });
    }

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

    // Always recalculate status for the transaction after payment
    if (payment.transaction_id) {
      const txnService = new TransactionService();
      console.log('[PAYMENT] Triggering transaction status update', { transactionId: payment.transaction_id });
      await txnService.updateTransactionStatus(payment.transaction_id);
    }

    return payment.toJSON() as PaymentResponseDTO;
  }

  private async updateUserBalancesAfterPayment(payment: Payment): Promise<void> {
  let userIdToUpdate: number | null = null;
  let userRole: typeof PARTY_TYPE.BUYER | typeof PARTY_TYPE.FARMER | null = null;

    if (payment.payer_type === PARTY_TYPE.BUYER && payment.payee_type === PARTY_TYPE.SHOP) {
      // Buyer pays shop: reduce buyer's balance (buyer owes less)
      userIdToUpdate = payment.counterparty_id;
      userRole = PARTY_TYPE.BUYER;
    } else if (payment.payer_type === PARTY_TYPE.SHOP && payment.payee_type === PARTY_TYPE.FARMER) {
      // Shop pays farmer: reduce farmer's balance (farmer is owed less)
      userIdToUpdate = payment.counterparty_id;
      userRole = PARTY_TYPE.FARMER;
    }

    if (userIdToUpdate && userRole) {
      const user = await User.findByPk(userIdToUpdate);
      if (!user) throw new Error(`User with id ${userIdToUpdate} not found`);

      // Capture previous balance BEFORE update
      const previousBalance = Number(user.balance || 0);


      let newBalance = previousBalance;
      const paymentAmount = Number(payment.amount);
      if (userRole === PARTY_TYPE.FARMER) {
        // Subtract payment from farmer's balance (pending amount)
        newBalance = previousBalance - paymentAmount;
      } else if (userRole === PARTY_TYPE.BUYER) {
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
        if (amountChange !== 0 && (userRole === PARTY_TYPE.BUYER || userRole === PARTY_TYPE.FARMER)) {
          await BalanceSnapshot.create({
            user_id: userIdToUpdate,
            balance_type: userRole === PARTY_TYPE.BUYER ? 'buyer' : 'farmer',
            previous_balance: previousBalance,
            amount_change: amountChange,
            new_balance: newBalance,
            transaction_type: 'payment',
            reference_id: payment.id,
            reference_type: 'payment',
            description: `Payment ${payment.payer_type} -> ${payment.payee_type}: ${payment.amount}`
          });
        }
      } catch (snapshotError: unknown) {
        const error = snapshotError as Error;
        console.warn(`[BALANCE SNAPSHOT WARNING] Could not create snapshot for user ${userIdToUpdate}:`, error?.message || 'Unknown error');
      }

  console.log(`[${userRole.toUpperCase()} BALANCE UPDATE] UserID: ${userIdToUpdate}, New Balance: ${newBalance}`);
    }
  }

  private async allocatePaymentToTransactions(payment: Payment): Promise<void> {
    // Only allocate buyer payments to shop (these fund commission realization)
    if (payment.payer_type !== PARTY_TYPE.BUYER || payment.payee_type !== PARTY_TYPE.SHOP) {
      return;
    }

    const paymentAmount = Number(payment.amount || 0);
    if (payment.transaction_id) {
      try {
        const targetTx = await Transaction.findByPk(payment.transaction_id);
        if (targetTx) {
          const transactionTotal = Number(targetTx.total_amount || 0);
          const existingAllocations = await PaymentAllocation.findAll({ where: { transaction_id: targetTx.id } });
          const alreadyPaid = existingAllocations.reduce((sum, alloc) => sum + Number(alloc.allocated_amount || 0), 0);
          const outstandingAmount = Math.max(transactionTotal - alreadyPaid, 0);
          if (outstandingAmount > 0) {
            const allocationAmount = Math.min(paymentAmount, outstandingAmount);
            await PaymentAllocation.create({ payment_id: payment.id, transaction_id: targetTx.id, allocated_amount: allocationAmount });
            console.log('[ALLOCATE] Direct allocation via payment.transaction_id', { paymentId: payment.id, transactionId: targetTx.id, allocationAmount });
          } else {
            console.log('[ALLOCATE] Target transaction already fully allocated', { transactionId: targetTx.id, alreadyPaid, transactionTotal });
          }
        } else {
          console.log('[ALLOCATE] Referenced transaction_id not found', { transaction_id: payment.transaction_id });
        }
      } catch (directErr: unknown) {
        const error = directErr as Error;
        console.warn('[ALLOCATE] Direct allocation error', error?.message || directErr);
      }
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
    } catch (err: unknown) {
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
    const transactionInclude: Record<string, unknown> = {
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
      payer_type: PARTY_TYPE.BUYER,
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