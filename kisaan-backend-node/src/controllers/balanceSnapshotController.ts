import { Request, Response } from 'express';
import BalanceSnapshot from '../models/balanceSnapshot';

export class BalanceSnapshotController {
  // POST /balance-snapshots - Create a new snapshot for a user
  async createSnapshot(req: Request, res: Response) {
    try {
      const { user_id, balance, snapshot_date } = req.body;
      if (!user_id || balance === undefined || !snapshot_date) {
        return res.status(400).json({ success: false, message: 'user_id, balance, and snapshot_date are required' });
      }
      const snapshot = await BalanceSnapshot.create({ user_id, balance, snapshot_date });
      return res.status(201).json({ success: true, data: snapshot });
    } catch (error) {
      console.error('Error creating balance snapshot:', error);
      return res.status(500).json({ success: false, message: 'Failed to create balance snapshot', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // GET /balance-snapshots/:user_id - Get all snapshots for a user
  async getSnapshots(req: Request, res: Response) {
    try {
      const { user_id } = req.params;
      const snapshots = await BalanceSnapshot.findAll({
        where: { user_id },
        order: [['snapshot_date', 'DESC']]
      });
      return res.json({ success: true, data: snapshots });
    } catch (error) {
      console.error('Error fetching balance snapshots:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch balance snapshots', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}
