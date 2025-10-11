
import { Payment, PaymentStatus, PaymentParty, PaymentMethod } from '../models/payment';
import { Op } from 'sequelize';
import { DomainError } from '../errors/DomainError';

export class PaymentRepository {
  async findByTransactionId(transactionId: number) {
    try {
      return await Payment.findAll({ where: { transaction_id: transactionId } });
    } catch (err) {
  throw new DomainError(`Failed to fetch payments by transaction ID: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findByStatus(status: PaymentStatus) {
    try {
      return await Payment.findAll({ where: { status } });
    } catch (err) {
  throw new DomainError(`Failed to fetch payments by status: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findByPayerPayee(payerType: PaymentParty, payeeType: PaymentParty) {
    try {
      return await Payment.findAll({ where: { payer_type: payerType, payee_type: payeeType } });
    } catch (err) {
  throw new DomainError(`Failed to fetch payments by payer/payee: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findByDateRange(start: Date, end: Date) {
    try {
      return await Payment.findAll({
        where: {
          payment_date: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        },
      });
    } catch (err) {
  throw new DomainError(`Failed to fetch payments by date range: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async create(paymentData: Partial<Payment>) {
    try {
  // Use PaymentCreationAttributes for type safety
  return await Payment.create(paymentData as any);
    } catch (err) {
  throw new DomainError(`Failed to create payment: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async updateStatus(paymentId: number, status: PaymentStatus) {
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) throw new DomainError('Payment not found');
      payment.status = status;
      await payment.save();
      return payment;
    } catch (err) {
  throw new DomainError(`Failed to update payment status: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
