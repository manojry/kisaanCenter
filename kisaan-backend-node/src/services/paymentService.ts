import { User } from '../models/user';
import { Payment, PaymentParty, PaymentMethod, PaymentStatus } from '../models/payment';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { Transaction } from '../models/transaction';
import { PaymentAllocation } from '../models/paymentAllocation';
import { logger } from '../shared/logging/logger';
import { AuditLog } from '../models/auditLog';
import { CreatePaymentDTO, PaymentResponseDTO, UpdatePaymentStatusDTO } from '../dtos';
import { Op } from 'sequelize';
import { PARTY_TYPE } from '../shared/partyTypes';
import { PAYMENT_STATUS, BALANCE_TYPE } from '../shared/constants/index';
import BalanceSnapshot from '../models/balanceSnapshot';
import { TransactionService } from './transactionService';

export class PaymentService {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
  }
  async createPayment(data: CreatePaymentDTO, userId: number): Promise<PaymentResponseDTO> {
    // Reject shop-to-shop payments (commission should not be a payment)
    if (data.payer_type === PARTY_TYPE.SHOP && data.payee_type === PARTY_TYPE.SHOP) {
      throw new Error('Shop-to-shop payments (commission) are not allowed. Do not include commission as a payment.');
    }

    // Create payment record first - ensure counterparty_id is set correctly
  const paymentData: Record<string, unknown> = {
      ...data,
      status: PaymentStatus.Paid,
      payer_type: PaymentParty[data.payer_type as keyof typeof PaymentParty],
      payee_type: PaymentParty[data.payee_type as keyof typeof PaymentParty],
      method: PaymentMethod[data.method as keyof typeof PaymentMethod]
    };
    if (data.transaction_id !== undefined) paymentData.transaction_id = data.transaction_id;
    else delete paymentData.transaction_id;

    // Set counterparty_id and shop_id based on payment type and transaction details
    if (data.transaction_id && (!data.counterparty_id || !data.shop_id)) {
      const transaction = await (await import('../models/transaction')).Transaction.findByPk(data.transaction_id);
      if (transaction) {
        // Always set shop_id from transaction if not provided
        if (!data.shop_id) {
          paymentData.shop_id = transaction.shop_id;
        }
        
        if (!data.counterparty_id) {
          if (data.payer_type === PARTY_TYPE.BUYER && data.payee_type === PARTY_TYPE.SHOP) {
            // Buyer pays shop - counterparty is the buyer
            paymentData.counterparty_id = transaction.buyer_id;
          } else if (data.payer_type === PARTY_TYPE.SHOP && data.payee_type === PARTY_TYPE.FARMER) {
            // Shop pays farmer - counterparty is the farmer
            paymentData.counterparty_id = transaction.farmer_id;
          }
        }
      }
    }
  console.log('[PAYMENT] Creating payment', paymentData);
  const payment = await this.paymentRepository.create(paymentData);
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
    let userRole: string | null = null;

    if (payment.payer_type === PARTY_TYPE.BUYER && payment.payee_type === PARTY_TYPE.SHOP) {
      // Buyer pays shop: reduce buyer's balance (buyer owes less)
      userIdToUpdate = payment.counterparty_id;
      userRole = PARTY_TYPE.BUYER;
    } else if (payment.payer_type === PARTY_TYPE.SHOP && payment.payee_type === PARTY_TYPE.FARMER) {
      // Shop pays farmer: reduce farmer's balance (farmer is owed less)
      // CRITICAL: Apply FIFO settlement logic first for farmers
      userIdToUpdate = payment.counterparty_id;
      userRole = PARTY_TYPE.FARMER;
      
      // For SHOP->FARMER payments, handle the payment correctly:
      // 1. First settle pending expenses (FIFO)
      // 2. Then reduce balance with remaining amount
      if (userIdToUpdate && payment.shop_id) {
        const { applyRepaymentFIFO } = await import('../services/settlementService');
        const paymentAmount = Number(payment.amount);
        
        try {
          // Apply FIFO settlement to clear expenses first
          const fifoResult = await applyRepaymentFIFO(payment.shop_id, userIdToUpdate, paymentAmount);
          const amountUsedForExpenses = paymentAmount - (fifoResult.remaining || 0);
          const remainingForBalance = fifoResult.remaining || 0;
          
          console.log('[PAYMENT] FIFO settlement applied for farmer payment', {
            farmerId: userIdToUpdate,
            shopId: payment.shop_id,
            totalPayment: paymentAmount,
            usedForExpenses: amountUsedForExpenses,
            remainingForBalance: remainingForBalance,
            fifoResult
          });
          
          // Override the balance update to only use remaining amount
          if (remainingForBalance > 0) {
            const user = await User.findByPk(userIdToUpdate);
            if (user) {
              const previousBalance = Number(user.balance || 0);
              const newBalance = Math.max(0, previousBalance - remainingForBalance);
              await user.update({ balance: newBalance });
              
              console.log('[FARMER BALANCE] Updated after expense settlement', {
                farmerId: userIdToUpdate,
                previousBalance,
                amountAppliedToBalance: remainingForBalance,
                newBalance
              });
              
              // Create balance snapshot for the balance portion only
              try {
                const amountChange = newBalance - previousBalance;
                if (amountChange !== 0) {
                  await BalanceSnapshot.create({
                    user_id: userIdToUpdate,
                    balance_type: BALANCE_TYPE.FARMER,
                    previous_balance: previousBalance,
                    amount_change: amountChange,
                    new_balance: newBalance,
                    transaction_type: 'payment',
                    reference_id: payment.id,
                    reference_type: 'payment',
                    description: `Payment balance update (after expense settlement): ${remainingForBalance}`
                  });
                }
              } catch (snapshotError: unknown) {
                const error = snapshotError as Error;
                console.warn(`[BALANCE SNAPSHOT WARNING] Could not create balance snapshot for user ${userIdToUpdate}:`, error?.message || 'Unknown error');
              }
            }
          }
          
          // Skip the regular balance update since we handled it above
          return;
          
        } catch (fifoError: unknown) {
          const error = fifoError as Error;
          console.warn('[PAYMENT] FIFO settlement failed, proceeding with regular balance update', {
            error: error?.message || 'Unknown error',
            farmerId: userIdToUpdate,
            paymentAmount
          });
          // Fall through to regular balance update if FIFO fails
        }
      }
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
            balance_type: userRole === PARTY_TYPE.BUYER ? BALANCE_TYPE.BUYER : BALANCE_TYPE.FARMER,
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
      // Map DTO values to enums for bulk
  const paymentData: Record<string, unknown> = {
        transaction_id: item.transaction_id,
        payer_type: PaymentParty[data.payer_type as keyof typeof PaymentParty],
        payee_type: PaymentParty[data.payee_type as keyof typeof PaymentParty],
        amount: item.amount,
        method: PaymentMethod[data.method as keyof typeof PaymentMethod],
        status: data.status ? PaymentStatus[data.status as keyof typeof PaymentStatus] : PaymentStatus.Pending,
        notes: data.notes,
      };
  const payment = await this.paymentRepository.create(paymentData);
      results.push(payment.toJSON() as PaymentResponseDTO);
    }
    return results;
  }

  async updatePaymentStatus(paymentId: number, data: UpdatePaymentStatusDTO, userId: number): Promise<PaymentResponseDTO | null> {
  const payment = await this.paymentRepository.findByTransactionId(paymentId).then(arr => arr[0]);
    if (!payment) {
      logger.error({ paymentId }, '[updatePaymentStatus] Payment not found');
      return null;
    }

    const oldValues = payment.toJSON();
    try {
      await payment.update({
        status: PaymentStatus[data.status as keyof typeof PaymentStatus],
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

    // If payment is now PAID and linked to a transaction, update transaction status
  if (payment.status === PAYMENT_STATUS.PAID && payment.transaction_id) {
      const txnService = new TransactionService();
      await txnService.updateTransactionStatus(payment.transaction_id);
    }
    return payment.toJSON() as PaymentResponseDTO;
  }

  async getPaymentsByTransaction(transactionId: number): Promise<PaymentResponseDTO[]> {
    const payments = await this.paymentRepository.findByTransactionId(transactionId);
    return payments.map((p: Payment) => p.toJSON() as PaymentResponseDTO);
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
  const payments = await this.paymentRepository.findByStatus(PaymentStatus.Pending);
    // Note: transactionInclude logic may need to be handled in repository for full parity
    return payments.map((p: Payment) => p.toJSON() as PaymentResponseDTO);
  }
  /**
   * Get all payments to a farmer (payee_type = 'FARMER'), with optional date filtering and aggregation
   */
  async getPaymentsToFarmer(
    farmerId: number,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{ totalPayments: number; totalPaid: number; payments: PaymentResponseDTO[] }> {
      const where: Record<string, unknown> = {
        payee_type: PARTY_TYPE.FARMER,
    status: { [Op.not]: PAYMENT_STATUS.FAILED }
      };
    if (options?.startDate && options?.endDate) {
      where.created_at = { [Op.between]: [options.startDate, options.endDate] };
    }
  const payments = await this.paymentRepository.findByPayerPayee(PaymentParty.Shop, PaymentParty.Farmer); // Example, adjust as needed
    const filtered = payments.filter((p: Payment) => p.counterparty_id === farmerId);
    const totalPaid = filtered.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
    return {
      totalPayments: filtered.length,
      totalPaid,
      payments: filtered.map((p: Payment) => p.toJSON() as PaymentResponseDTO)
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
  status: { [Op.not]: PAYMENT_STATUS.FAILED }
    };
    if (options?.startDate && options?.endDate) {
      where.created_at = { [Op.between]: [options.startDate, options.endDate] };
    }
  const payments = await this.paymentRepository.findByPayerPayee(PaymentParty.Buyer, PaymentParty.Shop); // Example, adjust as needed
    const filtered = payments.filter((p: Payment) => p.counterparty_id === buyerId);
    const totalPaid = filtered.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
    return {
      totalPayments: filtered.length,
      totalPaid,
      payments: filtered.map((p: Payment) => p.toJSON() as PaymentResponseDTO)
    };
  }
}