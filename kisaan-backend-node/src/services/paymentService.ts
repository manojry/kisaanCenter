// Payment service stub

import { Payment } from '../models/payment';
import { z } from 'zod';
import { PaymentSchema } from '../schemas/payment';

export const createPayment = async (data: any) => {
  // Validate input
  const validated = PaymentSchema.parse(data);
  // Map payment_type to type
  let type: 'full_payment' | 'partial_payment' | 'advance';
  switch (validated.payment_type) {
    case 'full':
      type = 'full_payment';
      break;
    case 'partial':
      type = 'partial_payment';
      break;
    case 'credit':
      type = 'advance';
      break;
    default:
      type = 'full_payment';
  }
  // Save payment
  const payment = await Payment.create({
    ...validated,
    payment_date: new Date(validated.payment_date),
    type,
  });
  return payment;
};

export const getPaymentsForTransaction = async (transactionId: number) => {
  // TODO: Implement get payments for transaction
};
