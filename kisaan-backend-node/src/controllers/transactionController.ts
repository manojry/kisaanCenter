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

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { shop_id, date_from, date_to, buyer_id, status, include_analytics } = req.query;
    
    console.log('Getting transactions with filters:', { shop_id, date_from, date_to, buyer_id, status, include_analytics });
    
    const result = await transactionService.getTransactions({ 
      shop_id: shop_id as string, 
      date_from: date_from as string, 
      date_to: date_to as string,
      buyer_id: buyer_id as string,
      status: status as string,
      include_analytics: include_analytics as string
    });
    
    const response: any = {
      success: true, 
      data: result.transactions,
      count: result.transactions.length,
      message: 'Transactions fetched successfully',
      filters: { shop_id, date_from, date_to, buyer_id, status }
    };
    
    // Include analytics if requested
    if (result.analytics) {
      response.analytics = result.analytics;
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in getTransactions controller:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions', message: error.message });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  // TODO: Fetch and return transaction
  res.status(200).json({ message: 'Transaction details (stub)' });
};
