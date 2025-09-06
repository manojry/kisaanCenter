import { Request, Response } from 'express';

import * as paymentService from '../services/paymentService';
import { z } from 'zod';


export const createPayment = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validated = (await import('../schemas/payment')).PaymentSchema.parse(req.body);
    const payment = await paymentService.createPayment(validated);
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ success: false, error: 'Failed to create payment', message: error.message });
  }
};

export const getPaymentsForTransaction = async (req: Request, res: Response) => {
  // TODO: Fetch and return payments
  res.status(200).json({ message: 'Payments for transaction (stub)' });
};
