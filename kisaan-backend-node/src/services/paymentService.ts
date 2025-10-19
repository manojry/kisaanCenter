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
import { ValidationError } from '../shared/utils/errors';
import BalanceSnapshot from '../models/balanceSnapshot';
import { TransactionLedger } from '../models/transactionLedger';
import { TransactionService } from './transactionService';
import sequelize from '../config/database';

// Result shape returned by balance update operations
// appliedToExpenses: amount consumed by expense settlements
// appliedToBalance: amount applied to user's stored balance
// fifoResult: optional detailed FIFO settlement object returned by settlement service
export type BalanceResult = { appliedToExpenses: number; appliedToBalance: number; fifoResult?: unknown };

export class PaymentService {
  private readonly paymentRepository: PaymentRepository;

  

  constructor() {
    this.paymentRepository = new PaymentRepository();
  }
  async createPayment(data: CreatePaymentDTO, userId: number, options?: { tx?: import('sequelize').Transaction }): Promise<any> {
    // Reject shop-to-shop payments (commission should not be a payment)
    if (data.payer_type === PARTY_TYPE.SHOP && data.payee_type === PARTY_TYPE.SHOP) {
      logger.error({ payload: data }, 'Shop-to-shop payments (commission) are not allowed.');
      throw new Error('Shop-to-shop payments (commission) are not allowed. Do not include commission as a payment.');
    }

    // Map and validate enums, with normalization for common frontend variants
    const normalizeParty = (v: unknown) => (v == null ? '' : String(v).toUpperCase());
    const normalizeStatus = (v: unknown) => (v == null ? '' : String(v).toUpperCase());

    const payerNormalized = normalizeParty(data.payer_type);
    const payeeNormalized = normalizeParty(data.payee_type);
    const mappedPayerType = Object.values(PaymentParty).includes(payerNormalized as PaymentParty)
      ? (payerNormalized as PaymentParty)
      : undefined;
    const mappedPayeeType = Object.values(PaymentParty).includes(payeeNormalized as PaymentParty)
      ? (payeeNormalized as PaymentParty)
      : undefined;

    const mappedMethod = PaymentMethod[String(data.method || '').toUpperCase() as keyof typeof PaymentMethod] || PaymentMethod.Cash;

    // Validate payer/payee/method presence and throw ValidationError with context
    const invalidFields: string[] = [];
    if (!mappedPayerType) invalidFields.push(`payer_type=${String(data.payer_type)}`);
    if (!mappedPayeeType) invalidFields.push(`payee_type=${String(data.payee_type)}`);
    if (!mappedMethod) invalidFields.push(`method=${String(data.method)}`);
    if (invalidFields.length > 0) {
      logger.error({ payload: data }, `Invalid payment fields: ${invalidFields.join(', ')}`);
      throw new ValidationError('Missing or invalid payment fields', { invalidFields, payload: data });
    }

    // Normalize and validate incoming status (accept PAID / COMPLETED aliases)
    let normalizedStatus: PaymentStatus | undefined;
    if (data.status !== undefined && data.status !== null) {
      const statusCand = normalizeStatus(data.status);
      // Accept common synonyms
      if (statusCand === 'PAID' || statusCand === 'COMPLETED') normalizedStatus = PaymentStatus.Paid;
      else if (statusCand === 'PENDING') normalizedStatus = PaymentStatus.Pending;
      else if (statusCand === 'FAILED') normalizedStatus = PaymentStatus.Failed;
      else if (statusCand === 'CANCELLED' || statusCand === 'CANCELED') normalizedStatus = PaymentStatus.Cancelled;
      else normalizedStatus = undefined;
      if (!normalizedStatus) {
        throw new ValidationError('Invalid payment status', { provided: data.status, allowed: ['PAID','COMPLETED','PENDING','FAILED','CANCELLED'] });
      }
    }

    const paymentData: Record<string, unknown> = {
      ...data,
      status: normalizedStatus ?? PaymentStatus.Paid,
      payer_type: mappedPayerType,
      payee_type: mappedPayeeType,
      method: mappedMethod
    };
    // Handle transaction_id: set to null if not provided (for balance payments not tied to transactions)
    if (data.transaction_id !== undefined) {
      paymentData.transaction_id = data.transaction_id;
    } else {
      paymentData.transaction_id = null;
    }

    // Defensive validation for required fields
    const missingFields: string[] = [];
    if (!data.amount) missingFields.push('amount');
    if (!data.payer_type) missingFields.push('payer_type');
    if (!data.payee_type) missingFields.push('payee_type');
    // payment_date and counterparty_id will be checked below

    // Set counterparty_id and shop_id based on payment type and transaction details
    if (data.transaction_id && (!data.counterparty_id || !data.shop_id)) {
      const transaction = await (await import('../models/transaction')).Transaction.findByPk(data.transaction_id);
      if (transaction) {
        if (!data.shop_id && !paymentData.shop_id) {
          paymentData.shop_id = transaction.shop_id;
          logger.info({ transactionId: data.transaction_id, shopId: transaction.shop_id }, 'Auto-populated shop_id from transaction');
        }
        if (!data.counterparty_id && !paymentData.counterparty_id) {
          if (data.payer_type === PARTY_TYPE.BUYER && data.payee_type === PARTY_TYPE.SHOP) {
            paymentData.counterparty_id = transaction.buyer_id;
            logger.info({ transactionId: data.transaction_id, buyerId: transaction.buyer_id }, 'Auto-populated counterparty_id (buyer) from transaction');
          } else if (data.payer_type === PARTY_TYPE.SHOP && data.payee_type === PARTY_TYPE.FARMER) {
            paymentData.counterparty_id = transaction.farmer_id;
            logger.info({ transactionId: data.transaction_id, farmerId: transaction.farmer_id }, 'Auto-populated counterparty_id (farmer) from transaction');
          }
        }
        if (data.payment_date) {
          const pd = new Date(data.payment_date as string);
          paymentData.payment_date = isNaN(pd.getTime()) ? data.payment_date : pd;
        }
      }
    }
    if (data.payment_date && !paymentData.payment_date) {
      const pd = new Date(data.payment_date as string);
      paymentData.payment_date = isNaN(pd.getTime()) ? data.payment_date : pd;
    }

    // Final required field checks
    if (!paymentData.counterparty_id) missingFields.push('counterparty_id');
    if (!paymentData.payment_date) missingFields.push('payment_date');
    if (!paymentData.shop_id) missingFields.push('shop_id');
    if (missingFields.length > 0) {
      logger.warn({ paymentData, missingFields }, 'Missing required fields for payment creation');
      throw new Error(`Missing required fields for payment creation: ${missingFields.join(', ')}`);
    }

    logger.info({ payload: data, normalized: paymentData }, 'Creating payment');    
  const payment = await this.paymentRepository.create(paymentData, options);      
    if (!payment || !payment.id) {
      logger.error({ paymentData }, 'Payment creation failed: No valid payment ID returned');
      throw new Error('Payment creation failed: No valid payment ID returned');   
    }
    logger.info({ payment: payment.toJSON() }, 'Created payment');

    // Allocate payment to outstanding transactions (direct allocations or FIFO)
    // Do this immediately so subsequent balance recalculation sees the allocation records.
    try {
      await this.allocatePaymentToTransactions(payment);
    } catch (allocErr) {
      console.warn('[ALLOCATE] Error allocating payment immediately after creation', { paymentId: payment.id, err: (allocErr as Error).message || allocErr });
    }

    // Post-insert consistency check for NULL payment_date/counterparty_id        
    if (!payment.payment_date || !payment.counterparty_id) {
      logger.error({ payment: payment.toJSON() }, 'Payment created with NULL payment_date or counterparty_id');
    }

    // IMPORTANT: Skip balance updates for payments that are part of transaction creation
    // The transaction service's updateUserBalances already accounts for these payments
    // Only update balances for standalone settlement payments (no transaction_id)
  let balanceResult: BalanceResult | undefined;
    if (!payment.transaction_id) {
      // This is a standalone settlement payment - update balances
      // We must compute the actual balance delta AFTER recalculation so the ledger reflects the true change
      logger.info({ paymentId: payment.id }, 'Processing standalone settlement payment - updating balances');

      // SERVER-SIDE GUARD: Prevent unintentional SHOP->FARMER payments that worsen farmer debt
      // Extracted into a small helper for testability
      if (payment.payer_type === PARTY_TYPE.SHOP && payment.payee_type === PARTY_TYPE.FARMER) {
        try {
          const { willShopToFarmerWorsenDebt } = await import('./paymentGuard');
          const preview = await willShopToFarmerWorsenDebt({ shop_id: Number(payment.shop_id || 0) || undefined, counterparty_id: Number(payment.counterparty_id || 0) || undefined, amount: Number(payment.amount || 0), force_override: (payment as any).force_override });
          if (preview && preview.worsen) {
            logger.warn({ paymentId: payment.id, farmerId: payment.counterparty_id, currentBalance: preview.currentBalance, simulatedNewBalance: preview.simulatedNewBalance }, 'Rejected SHOP->FARMER payment that would worsen farmer debt without force_override');
            throw new ValidationError('Payment would increase farmer debt. Include force_override=true to proceed if you understand the consequences.', { currentBalance: preview.currentBalance, simulatedNewBalance: preview.simulatedNewBalance });
          }
        } catch (err) {
          if (err instanceof ValidationError) throw err;
          logger.warn({ err, paymentId: payment.id }, 'Error during SHOP->FARMER dry-run validation; proceeding with normal processing');
        }
      }

      // Capture previous balance for ledger delta calculation
      let previousBalance: number | null = null;
      if (payment.counterparty_id) {
        const userBefore = await User.findByPk(payment.counterparty_id, { transaction: options?.tx });
        previousBalance = Number(userBefore?.balance || 0);
      }

      // Recalculate and apply balances (this may update the user's balance and payment records)
      balanceResult = await this.updateUserBalancesAfterPayment(payment, options);

      // After balances updated, create a ledger entry that records the actual delta
      if (payment.counterparty_id) {
        const userAfter = await User.findByPk(payment.counterparty_id, { transaction: options?.tx });
        const afterBalance = Number(userAfter?.balance || 0);
        const delta = (previousBalance === null ? 0 : (afterBalance - previousBalance));
        const role = payment.payer_type === 'BUYER' || payment.payee_type === 'BUYER' ? 'buyer' : 'farmer';

        await TransactionLedger.create({
          user_id: payment.counterparty_id,
          transaction_id: null,
          delta_amount: delta,
          role,
          reason_code: 'PAYMENT',
          created_at: new Date(),
          balance_before: previousBalance ?? undefined,
          balance_after: afterBalance
        }, { transaction: options?.tx });
      }
    } else {
      // This is part of a transaction - skip balance update
      // The transaction's updateUserBalances method will handle this
      logger.info({ paymentId: payment.id, transactionId: payment.transaction_id }, 'Skipping balance update for transaction payment - handled by transaction service');
      balanceResult = { appliedToExpenses: 0, appliedToBalance: 0 };
    }
    // (Allocation now handled earlier immediately after payment creation)

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

    // Include applied breakdown for client visibility
    const base = payment.toJSON() as PaymentResponseDTO;
    return {
      ...base,
      applied_to_expenses: balanceResult?.appliedToExpenses ?? 0,
      applied_to_balance: balanceResult?.appliedToBalance ?? 0,
      fifo_result: balanceResult?.fifoResult ?? null
    };
  }

  private async updateUserBalancesAfterPayment(payment: Payment, options?: { tx?: import('sequelize').Transaction }): Promise<BalanceResult | undefined> {
    let userIdToUpdate: number | null = null;
    let userRole: string | null = null;
    let appliedToExpenses = 0;
    let appliedToBalance = 0;
    let fifoResult: unknown = undefined;

    if (payment.payer_type === PARTY_TYPE.BUYER && payment.payee_type === PARTY_TYPE.SHOP) {
      // Buyer pays shop: reduce buyer's balance (buyer owes less)
      userIdToUpdate = payment.counterparty_id;
      userRole = PARTY_TYPE.BUYER;
    } else if (payment.payer_type === PARTY_TYPE.FARMER && payment.payee_type === PARTY_TYPE.SHOP) {
      // Farmer pays shop: farmer pays down their debt (increase stored balance)
      userIdToUpdate = payment.counterparty_id;
      userRole = PARTY_TYPE.FARMER;

      if (userIdToUpdate && payment.shop_id) {
        const { applyRepaymentFIFO } = await import('../services/settlementService');
        const paymentAmount = Number(payment.amount);

        try {
          // Apply FIFO settlement to settle the farmer's pending expenses first
          fifoResult = await applyRepaymentFIFO(payment.shop_id, userIdToUpdate, paymentAmount, payment.id, options);
          const fifo = fifoResult as any;
          const remainingAfterExpenses = fifo?.remaining || 0;
          const amountUsedForExpenses = paymentAmount - remainingAfterExpenses;
          appliedToExpenses = amountUsedForExpenses;
          appliedToBalance = remainingAfterExpenses;

          console.log('[PAYMENT] FIFO settlement applied for farmer->shop payment', {
            farmerId: userIdToUpdate,
            shopId: payment.shop_id,
            totalPayment: paymentAmount,
            usedForExpenses: amountUsedForExpenses,
            remainingForBalance: remainingAfterExpenses,
            fifoResult
          });

          const user = await User.findByPk(userIdToUpdate);
          if (user) {
            const previousBalance = Number(user.balance || 0);
            const amountAppliedToBalance = remainingAfterExpenses;
            // Since farmer is paying the shop, the farmer's debt should decrease -> balance increases
            let newBalance = previousBalance + amountAppliedToBalance;
            await user.update({ balance: newBalance });

            console.log('[FARMER BALANCE] Updated after farmer->shop payment', {
              farmerId: userIdToUpdate,
              previousBalance,
              paymentAmount,
              amountUsedForExpenses,
              amountAppliedToBalance,
              newBalance
            });

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
                  description: `Farmer->shop payment applied to balance ${amountAppliedToBalance}`
                });
              }
            } catch (snapshotError: unknown) {
              const error = snapshotError as Error;
              console.warn(`[BALANCE SNAPSHOT WARNING] Could not create balance snapshot for user ${userIdToUpdate}:`, error?.message || 'Unknown error');
            }
          }

          return { appliedToExpenses, appliedToBalance, fifoResult };
        } catch (fifoError: unknown) {
          const error = fifoError as Error;
          console.warn('[PAYMENT] FIFO settlement failed for farmer->shop payment, proceeding with regular balance update', {
            error: error?.message || 'Unknown error',
            farmerId: userIdToUpdate,
            paymentAmount
          });
          // Fall through to regular balance recalculation if FIFO fails
        }
      }
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
          fifoResult = await applyRepaymentFIFO(payment.shop_id, userIdToUpdate, paymentAmount, payment.id, options);
          const fifo = fifoResult as any;
          const remainingForBalance = fifo?.remaining || 0;
          const amountUsedForExpenses = paymentAmount - remainingForBalance;
          appliedToExpenses = amountUsedForExpenses;
          appliedToBalance = remainingForBalance;

          console.log('[PAYMENT] FIFO settlement applied for farmer payment', {
            farmerId: userIdToUpdate,
            shopId: payment.shop_id,
            totalPayment: paymentAmount,
            usedForExpenses: amountUsedForExpenses,
            remainingForBalance: remainingForBalance,
            fifoResult
          });

          const user = await User.findByPk(userIdToUpdate);
          if (user) {
            const previousBalance = Number(user.balance || 0);
            const amountAppliedToBalance = remainingForBalance;
            let newBalance = previousBalance - amountAppliedToBalance;
            // NOTE: Negative balances are ALLOWED per business logic
            // Farmers can have negative balances (advances received)
            await user.update({ balance: newBalance });

            console.log('[FARMER BALANCE] Updated after expense settlement', {
              farmerId: userIdToUpdate,
              previousBalance,
              paymentAmount,
              amountUsedForExpenses,
              amountAppliedToBalance,
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
                  description: `Payment balance update (after expense settlement): applied to balance ${amountAppliedToBalance}`
                });
              }
            } catch (snapshotError: unknown) {
              const error = snapshotError as Error;
              console.warn(`[BALANCE SNAPSHOT WARNING] Could not create balance snapshot for user ${userIdToUpdate}:`, error?.message || 'Unknown error');
            }
          }

          // Return breakdown
          return { appliedToExpenses, appliedToBalance, fifoResult };

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

      // Capture previous balance BEFORE recalculation
      const previousBalance = Number(user.balance || 0);

      // IMPORTANT: Don't manually adjust balance - recalculate from transactions and payments
      // This ensures consistency with how TransactionService calculates balances
      let newBalance = previousBalance;
      
      if (userRole === PARTY_TYPE.FARMER) {
        // Recalculate farmer balance: sum of unpaid transaction earnings minus expenses
        const { Op } = await import('sequelize');
        const Transaction = (await import('../models/transaction')).Transaction;
        const PaymentAllocation = (await import('../models/paymentAllocation')).PaymentAllocation;
        const Payment = (await import('../models/payment')).Payment;
        const Settlement = (await import('../models/settlement')).Settlement;
        
        // Get all transactions for this farmer
        const allFarmerTxns = await Transaction.findAll({ 
          where: { farmer_id: userIdToUpdate } 
        });
        
        const txnIds = allFarmerTxns.map(t => t.id).filter((id): id is number => typeof id === 'number');
        
        // Get all payment allocations and payments for these transactions
        const allocations = await PaymentAllocation.findAll({ 
          where: { transaction_id: { [Op.in]: txnIds } } 
        });
        const payments = await Payment.findAll({ 
          where: { transaction_id: { [Op.in]: txnIds } } 
        });
        
        // Calculate unpaid earnings from transactions
        const unpaidTransactionEarnings = allFarmerTxns.reduce((sum, t) => {
          const paidToFarmer = allocations
            .filter(a => a.transaction_id === t.id)
            .map(a => {
              const pmt = payments.find(p => p.id === a.payment_id);
              if (pmt && pmt.payee_type === PARTY_TYPE.FARMER && pmt.status === 'PAID') {
                return Number(a.allocated_amount || 0);
              }
              return 0;
            })
            .reduce((s, v) => s + v, 0);
          const unpaid = Math.max(Number(t.farmer_earning || 0) - paidToFarmer, 0);
          return sum + unpaid;
        }, 0);
        
        // Subtract UNSETTLED expenses from farmer balance
        // Expenses represent money farmer owes to shop (advances, reimbursements, etc.)
        const ExpenseSettlement = (await import('../models/expenseSettlement')).default;
        const Expense = (await import('../models/expense')).default;
        
        // Get all expenses for this farmer
        const farmerExpenses = await Expense.findAll({
          where: {
            user_id: userIdToUpdate,
            shop_id: payment.shop_id
          }
        });
        
        // For each expense, calculate unsettled amount
        let totalUnsettledExpenses = 0;
        for (const expense of farmerExpenses) {
          const expenseAmount = Number(expense.amount || 0);
          
          // Get sum of settled amounts for this expense
          const settlements = await ExpenseSettlement.findAll({
            where: { expense_id: expense.id }
          });
          const settledAmount = settlements.reduce((sum: number, s: any) => 
            sum + Number(s.amount || 0), 0);
          
          // Unsettled portion = expense amount - settled amount
          const unsettled = Math.max(0, expenseAmount - settledAmount);
          totalUnsettledExpenses += unsettled;
        }
        
        newBalance = Math.round((unpaidTransactionEarnings - totalUnsettledExpenses) * 100) / 100;
        
      } else if (userRole === PARTY_TYPE.BUYER) {
        // Recalculate buyer balance: sum of unpaid transaction amounts
        const { Op } = await import('sequelize');
        const Transaction = (await import('../models/transaction')).Transaction;
        const PaymentAllocation = (await import('../models/paymentAllocation')).PaymentAllocation;
        const Payment = (await import('../models/payment')).Payment;
        
        // Get all transactions for this buyer
        const allBuyerTxns = await Transaction.findAll({ 
          where: { buyer_id: userIdToUpdate } 
        });
        
        const txnIds = allBuyerTxns.map(t => t.id).filter((id): id is number => typeof id === 'number');
        
        // Get all payment allocations and payments for these transactions
        const buyerAllocations = await PaymentAllocation.findAll({ 
          where: { transaction_id: { [Op.in]: txnIds } } 
        });
        const buyerPayments = await Payment.findAll({ 
          where: { transaction_id: { [Op.in]: txnIds } } 
        });
        
        // Calculate unpaid amounts from transactions
        newBalance = allBuyerTxns.reduce((sum, t) => {
          const paidByBuyer = buyerAllocations
            .filter(a => a.transaction_id === t.id)
            .map(a => {
              const pmt = buyerPayments.find(p => p.id === a.payment_id);
              if (pmt && pmt.payer_type === PARTY_TYPE.BUYER && pmt.status === 'PAID') {
                return Number(a.allocated_amount || 0);
              }
              return 0;
            })
            .reduce((s, v) => s + v, 0);
          const unpaid = Math.max(Number(t.total_amount || 0) - paidByBuyer, 0);
          return sum + unpaid;
        }, 0);
        
        newBalance = Math.round(newBalance * 100) / 100;
      }
      
      // NOTE: Negative balances are ALLOWED per business logic
      // Farmers can have negative balances (advances/expenses exceed earnings)
      // Buyers can have negative balances (overpayments)

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
      appliedToBalance = appliedToBalance || (userRole === PARTY_TYPE.FARMER || userRole === PARTY_TYPE.BUYER ? Number(payment.amount) : 0);
      
      // Update payment record with balance tracking information
      try {
        const { SettlementType } = await import('../models/payment');
        const paymentAmount = Number(payment.amount);
        
        // Determine settlement type based on expense application
        const settlementType = appliedToExpenses > 0 
          ? SettlementType.Adjustment // Mixed: part went to expenses, part to balance
          : (appliedToBalance >= paymentAmount ? SettlementType.Partial : SettlementType.Partial);
        
        const updateOptions = options?.tx ? { transaction: options.tx } : {};
        
        await payment.update({
          balance_before: previousBalance,
          balance_after: newBalance,
          settlement_type: settlementType
        }, updateOptions);
        
        console.log(`[PAYMENT BALANCE TRACKING] Updated payment #${payment.id} with balance info`, {
          balance_before: previousBalance,
          balance_after: newBalance,
          applied_to_expenses: appliedToExpenses,
          applied_to_balance: appliedToBalance,
          settlement_type: settlementType
        });
      } catch (updateError: unknown) {
        const error = updateError as Error;
        console.warn(`[PAYMENT UPDATE WARNING] Could not update payment #${payment.id} with balance tracking:`, error?.message || 'Unknown error');
      }
      
      return { appliedToExpenses, appliedToBalance, fifoResult };
    }
  }

  private async allocatePaymentToTransactions(payment: Payment): Promise<void> {
    const paymentAmount = Number(payment.amount || 0);
    
    // BUYER → SHOP payments: Allocate to buyer's outstanding transactions
    if (payment.payer_type === PARTY_TYPE.BUYER && payment.payee_type === PARTY_TYPE.SHOP) {
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
                const alloc = await PaymentAllocation.create({ payment_id: payment.id, transaction_id: targetTx.id, allocated_amount: allocationAmount });
                // Realize owner's commission proportionally for this allocation
                try {
                  const txn = targetTx; // Transaction model instance
                  const txnTotal = Number(txn.total_amount || 0);
                  const txnCommission = Number(txn.commission_amount || 0);
                  if (txnTotal > 0 && txnCommission > 0 && payment.shop_id) {
                    const commissionShare = Number((allocationAmount * (txnCommission / txnTotal)).toFixed(2));
                    if (commissionShare > 0) {
                      // Find shop owner and increment their cumulative_value atomically
                      const Shop = (await import('../models/shop')).Shop;
                      const shop = await Shop.findByPk(Number(payment.shop_id));
                      if (shop && shop.owner_id) {
                        const ownerId = Number(shop.owner_id);
                        try {
                          // Use sequelize increment for atomic update
                          await User.increment({ cumulative_value: commissionShare }, { where: { id: ownerId } });
                          // Optionally create an audit log entry (reuse existing action enum)
                          await AuditLog.create({
                            shop_id: Number(payment.shop_id) || 1,
                            user_id: 1,
                            action: 'payment_recorded',
                            entity_type: 'transaction',
                            entity_id: txn.id,
                            new_values: JSON.stringify({ allocated_amount: allocationAmount, commission_realized: commissionShare }),
                          });
                        } catch (incErr) {
                          console.warn('[COMMISSION] Failed to increment owner cumulative_value', { ownerId, commissionShare, err: (incErr as Error).message || incErr });
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.warn('[COMMISSION] Error computing commission share for allocation', { paymentId: payment.id, transactionId: targetTx.id, err: (err as Error).message || err });
                }
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
      return;
    }
    
    // SHOP → FARMER standalone payments: Allocate to farmer's outstanding transactions in FIFO order
    if (payment.payer_type === PARTY_TYPE.SHOP && payment.payee_type === PARTY_TYPE.FARMER && !payment.transaction_id && payment.counterparty_id) {
      try {
        const Transaction = (await import('../models/transaction')).Transaction;
        const PaymentAllocation = (await import('../models/paymentAllocation')).PaymentAllocation;
        
        // Get all farmer transactions ordered by date (FIFO)
        const farmerTransactions = await Transaction.findAll({
          where: { farmer_id: payment.counterparty_id },
          order: [['transaction_date', 'ASC'], ['id', 'ASC']]
        });
        
        let remainingAmount = paymentAmount;
        
        for (const txn of farmerTransactions) {
          if (remainingAmount <= 0) break;
          
          const farmerEarning = Number(txn.farmer_earning || 0);
          
          // Get existing allocations for this transaction
          const existingAllocations = await PaymentAllocation.findAll({
            where: { transaction_id: txn.id }
          });
          
          // Calculate how much has already been paid to farmer for this transaction
          const Payment = (await import('../models/payment')).Payment;
          const paymentIds = existingAllocations.map(a => a.payment_id);
          const relatedPayments = paymentIds.length > 0 
            ? await Payment.findAll({ where: { id: paymentIds } })
            : [];
          
          const alreadyPaidToFarmer = existingAllocations
            .filter(a => {
              const pmt = relatedPayments.find(p => p.id === a.payment_id);
              return pmt && pmt.payee_type === PARTY_TYPE.FARMER && pmt.status === 'PAID';
            })
            .reduce((sum, a) => sum + Number(a.allocated_amount || 0), 0);
          
          const outstandingForFarmer = Math.max(farmerEarning - alreadyPaidToFarmer, 0);
          
          if (outstandingForFarmer > 0) {
            const allocationAmount = Math.min(remainingAmount, outstandingForFarmer);
            
            await PaymentAllocation.create({
              payment_id: payment.id,
              transaction_id: txn.id,
              allocated_amount: allocationAmount
            });
            
            remainingAmount -= allocationAmount;
            
            console.log('[ALLOCATE] Standalone farmer payment allocated to transaction', {
              paymentId: payment.id,
              transactionId: txn.id,
              allocationAmount,
              remainingAmount
            });
          }
        }
        
        if (remainingAmount > 0) {
          console.log('[ALLOCATE] Farmer payment has unallocated amount (advance payment)', {
            paymentId: payment.id,
            unallocatedAmount: remainingAmount
          });
        }
      } catch (error: unknown) {
        console.error('[ALLOCATE] Error allocating standalone farmer payment', error);
      }
    }
  }

  async createBulkPayments(data: import('../dtos/PaymentDTO').BulkPaymentDTO, _userId: number): Promise<PaymentResponseDTO[]> {
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
    if (payment) results.push((payment as any).toJSON() as PaymentResponseDTO);
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
    options?: { startDate?: Date; endDate?: Date; shopId?: number }
  ): Promise<{ 
    totalPayments: number; 
    totalPaid: number; 
    payments: PaymentResponseDTO[];
    expenses: {
      totalExpenses: number;
      totalSettled: number;
      totalUnsettled: number;
      expenses: Array<{
        id: number;
        amount: number;
        settled: number;
        unsettled: number;
        description: string;
        created_at: Date;
        status: string;
      }>;
    };
  }> {
    try {
      // Fetch payments
      const where: Record<string, unknown> = {
        payee_type: PARTY_TYPE.FARMER,
        counterparty_id: farmerId,
        status: { [Op.not]: PAYMENT_STATUS.FAILED }
      };
      if (options?.startDate && options?.endDate) {
        where.created_at = { [Op.between]: [options.startDate, options.endDate] };
      }
      const payments = await this.paymentRepository.findByFilters(where);
      const totalPaid = payments.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
      
      // Fetch expenses for this farmer
      const Expense = (await import('../models/expense')).default;
      const ExpenseSettlement = (await import('../models/expenseSettlement')).default;
      
      const expenseWhere: Record<string, unknown> = {
        user_id: farmerId
      };
      if (options?.shopId) {
        expenseWhere.shop_id = options.shopId;
      }
      
      const farmerExpenses = await Expense.findAll({
        where: expenseWhere,
        order: [['created_at', 'DESC']]
      });
      
      // Calculate settled and unsettled amounts for each expense
      const expenseDetails = await Promise.all(
        farmerExpenses.map(async (expense: any) => {
          const expenseAmount = Number(expense.amount || 0);
          
          // Get settlements for this expense
          const settlements = await ExpenseSettlement.findAll({
            where: { expense_id: expense.id }
          });
          const settledAmount = settlements.reduce((sum: number, s: any) => 
            sum + Number(s.amount || 0), 0);
          
          const unsettledAmount = Math.max(0, expenseAmount - settledAmount);
          
          return {
            id: expense.id,
            amount: expenseAmount,
            settled: settledAmount,
            unsettled: unsettledAmount,
            description: expense.description || '',
            created_at: expense.created_at,
            status: expense.status
          };
        })
      );
      
      const totalExpenses = expenseDetails.reduce((sum, e) => sum + e.amount, 0);
      const totalSettled = expenseDetails.reduce((sum, e) => sum + e.settled, 0);
      const totalUnsettled = expenseDetails.reduce((sum, e) => sum + e.unsettled, 0);
      
      return {
        totalPayments: payments.length,
        totalPaid,
        payments: payments.map((p: Payment) => p.toJSON() as PaymentResponseDTO),
        expenses: {
          totalExpenses,
          totalSettled,
          totalUnsettled,
          expenses: expenseDetails
        }
      };
    } catch (error) {
      logger.error({ farmerId, options, error }, 'Error fetching payments to farmer');
      throw error;
    }
  }

  /**
   * Get all payments by a buyer (payer_type = 'BUYER'), with optional date filtering and aggregation
   */
  async getPaymentsByBuyer(
    buyerId: number,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{ totalPayments: number; totalPaid: number; payments: PaymentResponseDTO[] }> {
    try {
      const where: Record<string, unknown> = {
        payer_type: PARTY_TYPE.BUYER,
        counterparty_id: buyerId,
        status: { [Op.not]: PAYMENT_STATUS.FAILED }
      };
      if (options?.startDate && options?.endDate) {
        where.created_at = { [Op.between]: [options.startDate, options.endDate] };
      }
      const payments = await this.paymentRepository.findByFilters(where);
      const totalPaid = payments.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
      return {
        totalPayments: payments.length,
        totalPaid,
        payments: payments.map((p: Payment) => p.toJSON() as PaymentResponseDTO)
      };
    } catch (error) {
      logger.error({ buyerId, options, error }, 'Error fetching payments by buyer');
      throw error;
    }
  }

  /**
   * Adjust existing payments when an expense is entered retroactively
   * Applies expense amount to reduce recent payments to the farmer (reverse FIFO - newest first)
   */
  async adjustPaymentsForExpense(
    shopId: number,
    farmerId: number,
    expenseAmount: number,
    expenseId: number,
    options?: { tx?: import('sequelize').Transaction }
  ): Promise<{ adjustedPayments: Array<{ paymentId: number; originalAmount: number; adjustedAmount: number; adjustment: number }>; totalAdjusted: number }> {
    const adjustedPayments: Array<{ paymentId: number; originalAmount: number; adjustedAmount: number; adjustment: number }> = [];
    let remainingExpense = expenseAmount;
    let totalAdjusted = 0;

    // Find recent payments made to this farmer (last 30 days, ordered by newest first)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = await this.paymentRepository.findByFilters({
      shop_id: shopId,
      counterparty_id: farmerId,
      payer_type: PaymentParty.Shop,
      payee_type: PaymentParty.Farmer,
      status: PaymentStatus.Paid,
      created_at: { [Op.gte]: thirtyDaysAgo }
    }, { order: [['created_at', 'DESC']] }); // Newest first (reverse FIFO)

    for (const payment of recentPayments) {
      if (remainingExpense <= 0) break;

      const paymentAmount = Number(payment.amount);
      const adjustment = Math.min(remainingExpense, paymentAmount);

      if (adjustment > 0) {
        const newAmount = paymentAmount - adjustment;

        // Update payment amount
        await payment.update(
          {
            amount: newAmount,
            notes: `${payment.notes || ''} [ADJUSTED: -₹${adjustment} for expense #${expenseId}]`.trim()
          },
          options?.tx ? { transaction: options.tx } : undefined
        );

        // Log the adjustment
        await AuditLog.create({
          user_id: 1, // System user for automated adjustments
          action: 'payment_recorded', // Use existing action type
          entity_type: 'payment',
          entity_id: payment.id,
          old_values: JSON.stringify({ amount: paymentAmount }),
          new_values: JSON.stringify({ amount: newAmount }),
          shop_id: shopId
        });

        adjustedPayments.push({
          paymentId: payment.id,
          originalAmount: paymentAmount,
          adjustedAmount: newAmount,
          adjustment: adjustment
        });

        remainingExpense -= adjustment;
        totalAdjusted += adjustment;

        logger.info({
          paymentId: payment.id,
          expenseId,
          originalAmount: paymentAmount,
          adjustedAmount: newAmount,
          adjustment
        }, 'Payment adjusted for retroactive expense');
      }
    }

    return { adjustedPayments, totalAdjusted };
  }
}