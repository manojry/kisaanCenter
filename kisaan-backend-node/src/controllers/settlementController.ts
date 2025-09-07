import { Request, Response } from 'express';
import { getSettlements, getSettlementSummary, settleAmount, createSettlement } from '../services/settlementService';

export const getSettlementsController = async (req: Request, res: Response) => {
  try {
    const { shop_id, user_id, user_type, status } = req.query;
    
    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required' });
    }

    const settlements = await getSettlements({
      shop_id: shop_id as string,
      user_id: user_id as string,
      user_type: user_type as string,
      status: status as string
    });

    res.json({ success: true, data: settlements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSettlementSummaryController = async (req: Request, res: Response) => {
  try {
    const { shop_id } = req.query;
    
    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required' });
    }

    const summary = await getSettlementSummary(shop_id as string);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const settleAmountController = async (req: Request, res: Response) => {
  try {
    const { settlement_id } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const settlement = await settleAmount(parseInt(settlement_id), parseFloat(amount));
    res.json({ success: true, data: settlement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createExpenseController = async (req: Request, res: Response) => {
  try {
    const { shop_id, amount, description } = req.body;
    
    if (!shop_id || !amount || !description) {
      return res.status(400).json({ error: 'shop_id, amount, and description are required' });
    }

    const expense = await createSettlement({
      shop_id: parseInt(shop_id),
      user_id: 'shop',
      user_type: 'farmer', // Using farmer as default for shop expenses
      amount: parseFloat(amount),
      type: 'expense',
      description
    });

    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};