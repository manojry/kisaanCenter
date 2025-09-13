
import { User } from '../models/user';
import { Payment } from '../models/payment';
import { Transaction } from '../models/transaction';
import { AuditLog } from '../models/auditLog';
import { CreatePaymentDTO, PaymentResponseDTO, UpdatePaymentStatusDTO } from '../dtos';
import { Op } from 'sequelize';
import BalanceSnapshot from '../models/balanceSnapshot';




export class PaymentService {
  async createPayment(data: CreatePaymentDTO, userId: number): Promise<PaymentResponseDTO> {
    // Bookkeeping logic: always use running balance from latest snapshot
    let userToUpdate: User | null = null;
    let userRole: 'buyer' | 'farmer' | null = null;
    let userIdToUpdate: number | null = null;
    if (data.payer_type === 'BUYER' && data.payee_type === 'SHOP') {
      // Buyer pays shop: reduce buyer's balance
      if (!data.transaction_id) throw new Error('transaction_id required for buyer payment');
      const tx = await Transaction.findByPk(data.transaction_id);
      if (!tx) throw new Error(`Transaction with id ${data.transaction_id} does not exist`);
      userIdToUpdate = tx.buyer_id;
      userRole = 'buyer';
    } else if (data.payer_type === 'SHOP' && data.payee_type === 'FARMER') {
      if (data.transaction_id) {
        const tx = await Transaction.findByPk(data.transaction_id);
        if (!tx) throw new Error(`Transaction with id ${data.transaction_id} does not exist`);
        userIdToUpdate = tx.farmer_id;
        userRole = 'farmer';
      } else {
        // Advance payment to farmer (not linked to transaction)
        if (!data.amount) throw new Error('Amount required for advance payment');
        if (!data.notes) console.warn('[PAYMENT][ADVANCE] No notes provided for advance payment');
        // Require explicit payee_id in notes or extend DTO for robustness
        throw new Error('Advance payment must specify farmer_id (not implemented in this patch)');
      }
    }
    if (userIdToUpdate) {
      userToUpdate = await User.findByPk(userIdToUpdate);
      if (!userToUpdate) throw new Error(`User with id ${userIdToUpdate} not found`);
      // Get latest balance snapshot for this user
      const latestSnapshot = await BalanceSnapshot.findOne({
        where: { user_id: userIdToUpdate },
        order: [['snapshot_date', 'DESC']]
      });
      let runningBalance = latestSnapshot ? Number(latestSnapshot.balance) : Number(userToUpdate.balance);
      // Subtract payment from running balance
      runningBalance -= Number(data.amount);
      // Update user balance
      await userToUpdate.update({ balance: runningBalance });
      // Optionally, create a new snapshot here if you want to record every payment as a snapshot
    }
    // Create payment record (transaction_id may be undefined)
    const paymentData: any = { ...data, status: 'PENDING' };
    if (data.transaction_id !== undefined) paymentData.transaction_id = data.transaction_id;
    else delete paymentData.transaction_id;
    const payment = await Payment.create(paymentData);
    if (!payment || !payment.id) {
      throw new Error('Payment creation failed: No valid payment ID returned');
    }
    // Create audit log (skip shop_id if no transaction)
    let shop_id = 0;
    if (data.transaction_id) {
      const transaction = await Transaction.findByPk(data.transaction_id);
      shop_id = transaction?.shop_id || 0;
    }
    await AuditLog.create({
      shop_id,
      user_id: userId,
      action: 'payment_recorded',
      entity_type: 'payment',
      entity_id: payment.id,
      new_values: JSON.stringify(payment.toJSON())
    });
    return payment.toJSON() as PaymentResponseDTO;
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
    const relatedTransaction = await Transaction.findByPk(payment.transaction_id);
    if (!relatedTransaction) throw new Error('Related transaction not found for payment audit log');

    await AuditLog.create({
      shop_id: relatedTransaction.shop_id,
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