import { Payment } from '../models/payment';
import { Transaction } from '../models/transaction';
import { AuditLog } from '../models/auditLog';
import { CreatePaymentDTO, PaymentResponseDTO, UpdatePaymentStatusDTO } from '../dtos';
import { Op } from 'sequelize';

export class PaymentService {
  async createPayment(data: CreatePaymentDTO, userId: number): Promise<PaymentResponseDTO> {
    const payment = await Payment.create({
      ...data,
      status: 'PENDING'
    });

    // Create audit log
    await AuditLog.create({
      shop_id: 0, // Will be updated with transaction's shop_id
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
    if (!payment) return null;

    const oldValues = payment.toJSON();
    
    await payment.update({
      status: data.status,
      payment_date: data.payment_date || new Date(),
      notes: data.notes || payment.notes
    });

    // Create audit log
    await AuditLog.create({
      shop_id: 0, // Will be updated with transaction's shop_id
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