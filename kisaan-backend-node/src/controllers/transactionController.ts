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
    const { shop_id, date_from, date_to, buyer_id, status, include_analytics, owner_id } = req.query;

    // Optionally, get owner_id from req.user if you have authentication middleware
    // const ownerId = req.user?.owner_id || (owner_id as string);
    const ownerId = owner_id as string | undefined;

    // Enforce that at least one of owner_id or shop_id must be provided
    if (!shop_id && !ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required filter',
        message: 'You must provide either owner_id or shop_id as a query parameter.'
      });
    }

    console.log('Getting transactions with filters:', { shop_id, date_from, date_to, buyer_id, status, include_analytics, owner_id: ownerId });

    const result = await transactionService.getTransactions({ 
      shop_id: shop_id as string, 
      date_from: date_from as string, 
      date_to: date_to as string,
      buyer_id: buyer_id as string,
      status: status as string,
      include_analytics: include_analytics as string,
      owner_id: ownerId
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
