import { Payment } from '../models/payment';

export class PaymentRepository {
  async findByTransactionId(transactionId: number) {
    return Payment.findAll({ where: { transaction_id: transactionId } });
  }
}
