import { Request, Response } from 'express';
import { CreditService } from '../services/creditService';

const creditService = new CreditService();

export class CreditController {
  async apply(req: Request, res: Response) {
    try {
      const { user_id, amount, type, note } = req.body || {};
      const result = await creditService.applyAdjustment({ user_id: Number(user_id), amount: Number(amount), type, note });
      return res.status(201).json({ success: true, data: result, message: 'Adjustment applied' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'Failed to apply adjustment' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const rows = await creditService.listAdjustments(userId);
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'Failed to list adjustments' });
    }
  }
}
