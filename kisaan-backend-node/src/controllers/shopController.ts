
import { Request, Response } from 'express';
import { Shop } from '../models/shop';
import { sequelize } from '../models/index';
import * as shopService from '../services/shopService';
import { AuthenticatedRequest } from '../middlewares/auth';
import { CommissionService } from '../services/commissionService';

// Returns all users with role 'owner' who do not have a shop assigned
export class ShopController {
  async getAvailableOwners(req: Request, res: Response) {
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
  }

  async createShop(req: AuthenticatedRequest, res: Response) {
    try {
      const shop = await shopService.createShop(req.body);

      // Insert 10% percentage commission for the created shop
      try {
        const commissionService = new CommissionService();
        await commissionService.createCommission({
          shop_id: shop.id,
          rate: 10,
          type: 'percentage',
        }, req.user?.id || 0);
      } catch (commissionError) {
        console.error('Error creating commission for shop:', commissionError);
        // Optionally, you can return an error or continue
      }

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
  }



  async getShops(req: AuthenticatedRequest, res: Response) {
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
  }

  async getShopById(req: AuthenticatedRequest, res: Response) {
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
  }

  async updateShop(req: AuthenticatedRequest, res: Response) {
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
  }

  async deleteShop(req: AuthenticatedRequest, res: Response) {
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
  }
}
