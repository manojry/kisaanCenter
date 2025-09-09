import { User } from '../models/user';
import { Payment } from '../models/payment';
import { Transaction } from '../models/transaction';
import { AuditLog } from '../models/auditLog';
import { CreatePaymentDTO, PaymentResponseDTO, UpdatePaymentStatusDTO } from '../dtos';
import { Op } from 'sequelize';

export class PaymentService {
  async createPayment(data: CreatePaymentDTO, userId: number): Promise<PaymentResponseDTO> {
    // Update balances based on payment direction
    if (data.payer_type === 'BUYER' && data.payee_type === 'SHOP') {
      // Buyer pays shop: buyer's balance increases (toward zero)
      await User.increment({ balance: Number(data.amount) }, { where: { id: (await Transaction.findByPk(data.transaction_id))?.buyer_id } });
    } else if (data.payer_type === 'SHOP' && data.payee_type === 'FARMER') {
      // Shop pays farmer: farmer's balance decreases (toward zero)
      await User.increment({ balance: -Number(data.amount) }, { where: { id: (await Transaction.findByPk(data.transaction_id))?.farmer_id } });
    }
    // Defensive: Validate referenced transaction exists
    const transaction = await Transaction.findByPk(data.transaction_id);
    if (!transaction) throw new Error(`Transaction with id ${data.transaction_id} does not exist`);

    const payment = await Payment.create({
      ...data,
      status: 'PENDING'
    });

    if (!payment || !payment.id) {
      throw new Error('Payment creation failed: No valid payment ID returned');
    }

    // Create audit log
    await AuditLog.create({
      shop_id: transaction.shop_id || 0,
      user_id: userId,
      action: 'payment_recorded',
      entity_type: 'payment',
      entity_id: payment.id,
      new_values: JSON.stringify(payment.toJSON())
    });

    return payment.toJSON() as PaymentResponseDTO;
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
}