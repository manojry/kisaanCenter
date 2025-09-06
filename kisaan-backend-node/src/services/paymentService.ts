// Payment service stub

import { Payment } from '../models/payment';
import { z } from 'zod';
import { PaymentSchema } from '../schemas/payment';

export const createPayment = async (data: any) => {
  // Validate input
  const validated = PaymentSchema.parse(data);
  // Save payment
  const payment = await Payment.create({
    ...validated,
    payment_date: new Date(validated.payment_date),
  });
  return payment;
};

export const getPaymentsForTransaction = async (transactionId: number) => {
  // TODO: Implement get payments for transaction
};
