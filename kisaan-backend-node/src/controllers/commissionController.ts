import { Request, Response } from 'express';

import * as commissionService from '../services/commissionService';
import { z } from 'zod';
import { CalculateCommissionSchema } from '../schemas/commission';


export const calculateCommission = async (req: Request, res: Response) => {
  try {
    const validated = CalculateCommissionSchema.parse(req.body);
    const commission = await commissionService.calculateCommission(validated.transaction_id);
    res.status(200).json({ success: true, data: commission });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ success: false, error: 'Failed to calculate commission', message: error.message });
  }
};


export const getCommissionSummary = async (req: Request, res: Response) => {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    if (isNaN(shopId)) {
      return res.status(400).json({ success: false, error: 'Invalid shopId' });
    }
    const summary = await commissionService.getCommissionSummary(shopId);
    res.status(200).json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to get commission summary', message: error.message });
  }
};
