// Returns all users with role 'owner' who do not have a shop assigned
export const getAvailableOwners = async (req: Request, res: Response) => {
  try {
    const owners = await shopService.getAvailableOwners();
    res.json({
      success: true,
      data: owners,
      count: owners.length
    });
  } catch (error: any) {
    console.error('Error fetching available owners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available owners',
      message: error.message
    });
  }
};
import { Request, Response } from 'express';
import { Shop } from '../models/shop';
import { sequelize } from '../models/index';
import * as shopService from '../services/shopService';
import { AuthenticatedRequest } from '../middlewares/auth';

export const createShop = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shop = await shopService.createShop(req.body);
    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: shop,
    });
  } catch (error: any) {
    console.error('Error creating shop:', error);
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create shop',
      message: error.message,
    });
  }
};



export const getShops = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shops = await shopService.getAllShops(undefined, req.user);
    res.json({
      success: true,
      data: shops,
      count: shops.length,
    });
  } catch (error: any) {
    console.error('Error fetching shops:', error);
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shops',
      message: error.message,
    });
  }
};

export const getShopById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const shop = await shopService.getShopById(parseInt(id), req.user);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
      });
    }
    
    res.json({
      success: true,
      data: shop,
    });
  } catch (error: any) {
    console.error('Error fetching shop:', error);
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop',
      message: error.message,
    });
  }
};

export const updateShop = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid or missing shop id parameter' 
      });
    }
    
    const shop = await shopService.updateShop(parseInt(id), req.body, req.user);
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: shop,
    });
  } catch (error: any) {
    console.error('Error updating shop:', error);
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update shop',
      message: error.message,
    });
  }
};

export const deleteShop = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await shopService.deleteShop(parseInt(id), req.user);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Shop deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting shop:', error);
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete shop',
      message: error.message,
    });
  }
};
