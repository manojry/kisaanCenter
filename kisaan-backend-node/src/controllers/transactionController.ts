import { Request, Response } from 'express';

import * as transactionService from '../services/transactionService';
import { z } from 'zod';
import { TransactionSchema } from '../schemas/transaction';


export const createTransaction = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validated = TransactionSchema.parse(req.body);
    const transaction = await transactionService.createTransaction(validated);
    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ success: false, error: 'Failed to create transaction', message: error.message });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  // TODO: Fetch and return transaction
  res.status(200).json({ message: 'Transaction details (stub)' });
};
