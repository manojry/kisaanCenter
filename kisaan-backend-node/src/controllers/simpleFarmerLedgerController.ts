import { Request, Response } from 'express';
import { SimpleFarmerLedger } from '../models/simpleFarmerLedger';
import { simpleFarmerLedgerSchema } from '../schema/simpleFarmerLedgerSchema';

// Create a new ledger entry
export async function createEntry(req: Request, res: Response) {
  try {
    await simpleFarmerLedgerSchema.validate(req.body);
    const entry = await SimpleFarmerLedger.create(req.body);
    res.status(201).json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
}

// List entries (with filters)
export async function listEntries(req: Request, res: Response) {
  try {
    const { shop_id, farmer_id, from, to, category } = req.query;
    const where: any = {};
    if (shop_id) where.shop_id = Number(shop_id);
    if (farmer_id) where.farmer_id = Number(farmer_id);
    if (category) where.category = category;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at['$gte'] = from;
      if (to) where.created_at['$lte'] = to;
    }
    const entries = await SimpleFarmerLedger.findAll({ where, order: [['created_at', 'DESC']] });
    res.json(entries);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}

// Get farmer balance
export async function getFarmerBalance(req: Request, res: Response) {
  try {
    const { shop_id, farmer_id } = req.query;
    if (!shop_id || !farmer_id) return res.status(400).json({ error: 'shop_id and farmer_id required' });
    const shopIdNum = Number(shop_id);
    const farmerIdNum = Number(farmer_id);
    const entries = await SimpleFarmerLedger.findAll({ where: { shop_id: shopIdNum, farmer_id: farmerIdNum } });
    let credit = 0, debit = 0;
    for (const e of entries) {
      if (e.type === 'credit') credit += Number(e.amount);
      else debit += Number(e.amount);
    }
    res.json({ farmer_id: farmerIdNum, shop_id: shopIdNum, credit, debit, balance: credit - debit });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}

// Get summary (weekly/monthly)
export async function getSummary(req: Request, res: Response) {
  try {
    const { shop_id, farmer_id, period } = req.query;
    if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
    const shopIdNum = Number(shop_id);
    const farmerIdNum = farmer_id ? Number(farmer_id) : undefined;
    // Group by week or month
      const groupBy = period === 'monthly' ? "strftime('%Y-%m', created_at)" : "strftime('%Y-%W', created_at)";
      const results = await SimpleFarmerLedger.sequelize!.query(
        `SELECT ${groupBy} as period, type, SUM(amount) as total
         FROM kisaan_ledger
         WHERE shop_id = ?${farmerIdNum ? ' AND farmer_id = ?' : ''}
         GROUP BY period, type
         ORDER BY period DESC`,
      { replacements: farmerIdNum ? [shopIdNum, farmerIdNum] : [shopIdNum], type: 'SELECT' }
    );
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}

// Edit entry
export async function updateEntry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await simpleFarmerLedgerSchema.validate(req.body);
    const entry = await SimpleFarmerLedger.findByPk(id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    await entry.update(req.body);
    res.json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
}

// Delete entry
export async function deleteEntry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const entry = await SimpleFarmerLedger.findByPk(id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    await entry.destroy();
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
