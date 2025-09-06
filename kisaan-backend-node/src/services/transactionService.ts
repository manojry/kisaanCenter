// Transaction service stub

import { Transaction } from '../models/transaction';
import { z } from 'zod';
import { TransactionSchema } from '../schemas/transaction';

export const createTransaction = async (data: any) => {
  // Validate input
  const validated = TransactionSchema.parse(data);
  // Calculate total if not provided
  const total = validated.total || validated.price * validated.quantity;
  // Create transaction
  const transaction = await Transaction.create({
    ...validated,
    transaction_date: new Date(validated.transaction_date),
    total,
    status: 'pending',
  });
  return transaction;
};

export const getTransaction = async (id: number) => {
  // TODO: Implement get transaction by id
};
