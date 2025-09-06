import { Request, Response } from 'express';

import * as creditAdvanceService from '../services/creditAdvanceService';
import { z } from 'zod';
import { CreditAdvanceSchema, RepayCreditSchema } from '../schemas/creditAdvance';


export const issueCredit = async (req: Request, res: Response) => {
  try {
    const validated = CreditAdvanceSchema.parse(req.body);
    const credit = await creditAdvanceService.issueCredit(validated);
    res.status(201).json({ success: true, data: credit });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ success: false, error: 'Failed to issue credit', message: error.message });
  }
};


export const repayCredit = async (req: Request, res: Response) => {
  try {
    const validated = RepayCreditSchema.parse(req.body);
    const credit = await creditAdvanceService.repayCredit(validated);
    res.status(200).json({ success: true, data: credit });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ success: false, error: 'Failed to repay credit', message: error.message });
  }
};
