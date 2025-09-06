import { Request, Response } from 'express';
import { Shop } from '../models/shop';

export const createShop = async (req: Request, res: Response) => {
  try {
    const { name, owner_id, address, contact, status = 'active' } = req.body;
    
    // Validation
    if (!name || !owner_id || !address || !contact) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'owner_id', 'address', 'contact']
      });
    }
    
    const shop = await Shop.create({
      name,
      owner_id,
      address,
      contact,
      status,
    });
    
    res.status(201).json({
      message: 'Shop created successfully',
      shop: shop.toJSON(),
    });
  } catch (error: any) {
    console.error('Error creating shop:', error);
    res.status(500).json({
      error: 'Failed to create shop',
      message: error.message,
    });
  }
};

export const getShops = async (req: Request, res: Response) => {
  try {
    const shops = await Shop.findAll({
      order: [['createdAt', 'DESC']],
    });
    
    res.json({
      shops: shops.map(shop => shop.toJSON()),
      count: shops.length,
    });
  } catch (error: any) {
    console.error('Error fetching shops:', error);
    res.status(500).json({
      error: 'Failed to fetch shops',
      message: error.message,
    });
  }
};

export const getShopById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const shop = await Shop.findByPk(id);
    
    if (!shop) {
      return res.status(404).json({
        error: 'Shop not found',
      });
    }
    
    res.json({
      shop: shop.toJSON(),
    });
  } catch (error: any) {
    console.error('Error fetching shop:', error);
    res.status(500).json({
      error: 'Failed to fetch shop',
      message: error.message,
    });
  }
};

export const updateShop = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const shop = await Shop.findByPk(id);
    
    if (!shop) {
      return res.status(404).json({
        error: 'Shop not found',
      });
    }
    
    await shop.update(updateData);
    
    res.json({
      message: 'Shop updated successfully',
      shop: shop.toJSON(),
    });
  } catch (error: any) {
    console.error('Error updating shop:', error);
    res.status(500).json({
      error: 'Failed to update shop',
      message: error.message,
    });
  }
};

export const deleteShop = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const shop = await Shop.findByPk(id);
    
    if (!shop) {
      return res.status(404).json({
        error: 'Shop not found',
      });
    }
    
    await shop.destroy();
    
    res.json({
      message: 'Shop deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting shop:', error);
    res.status(500).json({
      error: 'Failed to delete shop',
      message: error.message,
    });
  }
};
