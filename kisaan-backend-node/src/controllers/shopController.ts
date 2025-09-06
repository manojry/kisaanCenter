import { Response, NextFunction } from 'express';
import { ShopCreateSchema, ShopUpdateSchema } from '../schemas/shop';
import * as shopService from '../services/shopService';

export const createShop = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  console.log('DEBUG: Received POST /api/v1/shops', req.body);
  try {
    const parsed = ShopCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('DEBUG: Validation failed', parsed.error.errors);
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }
    const shop = await shopService.createShop(parsed.data);
    console.log('DEBUG: Shop created', shop);
    res.status(201).json({ message: 'Shop created successfully', shop });
  } catch (err) {
    console.error('DEBUG: Error in createShop', err);
    next(err);
  }
};

export const getShops = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { owner_id } = req.query;
    const shops = await shopService.getAllShops(owner_id);
    res.json({ message: 'Shops retrieved successfully', shops });
  } catch (err) {
    next(err);
  }
};

export const getShopById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid shop ID' });
      return;
    }
    const shop = await shopService.getShopById(id);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    res.json({ message: 'Shop retrieved successfully', shop });
  } catch (err) {
    next(err);
  }
};

export const updateShop = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid shop ID' });
      return;
    }
    const parsed = ShopUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }
    const shop = await shopService.updateShop(id, parsed.data);
    res.json({ message: 'Shop updated successfully', shop });
  } catch (err) {
    next(err);
  }
};

export const deleteShop = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid shop ID' });
      return;
    }
    const deleted = await shopService.deleteShop(id);
    if (!deleted) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    res.json({ message: 'Shop deleted successfully' });
  } catch (err) {
    next(err);
  }
};
