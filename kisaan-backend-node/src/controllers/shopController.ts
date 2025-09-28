
import { Request, Response } from 'express';
import { Shop } from '../models/shop';
import { sequelize } from '../models/index';
import { ShopService } from '../services/shopService';
import { AuthenticatedRequest } from '../middlewares/auth';
import { CommissionService } from '../services/commissionService';
import { success, failureCode, created, standardDelete } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';
import { logger } from '../shared/logging/logger';
import { parseId } from '../shared/utils/parse';

// Returns all users with role 'owner' who do not have a shop assigned
export class ShopController {
  private shopService: ShopService;
  private commissionService: CommissionService;

  constructor() {
    this.shopService = new ShopService();
    this.commissionService = new CommissionService();
  }
  async getAvailableOwners(req: Request, res: Response) {
    try {
      const owners = await this.shopService.getAvailableOwners();
      return success(res, owners, { message: 'Available owners retrieved', meta: { count: owners.length } });
    } catch (error: any) {
      req.log?.error({ err: error }, 'shop:availableOwners failed');
  return failureCode(res, 500, ErrorCodes.GET_AVAILABLE_OWNERS_FAILED, undefined, error.message || 'Failed to fetch available owners');
    }
  }

  async createShop(req: AuthenticatedRequest, res: Response) {
    try {
  const shop = await this.shopService.createShop(req.body, req.user);

      // Insert 10% percentage commission for the created shop
      try {
        if (shop.id) {
          const commissionService = new CommissionService();
          await commissionService.createCommission({
            shop_id: shop.id,
            rate: 10,
            type: 'percentage',
          }, req.user?.id || 0);
        }
      } catch (commissionError: any) {
        // Log but do not fail the primary shop creation flow
        req.log?.error({ err: commissionError, shopId: shop.id }, 'shop:create commission creation failed');
      }

      return created(res, shop, { message: 'Shop created successfully' });
    } catch (error: any) {
      // Attach diagnostic context if DatabaseError provided it
      const details = error?.context?.diagnostic || error?.context || undefined;
      req.log?.error({ err: error, diagnostic: details }, 'shop:create failed');
      if (error.status) {
        return failureCode(res, error.status, ErrorCodes.CREATE_SHOP_FAILED, details, error.message);
      }
      return failureCode(res, 500, ErrorCodes.CREATE_SHOP_FAILED, details, error.message || 'Failed to create shop');
    }
  }



  async getShops(req: AuthenticatedRequest, res: Response) {
    try {
      const shops = await this.shopService.getAllShops(undefined, req.user);
      return success(res, shops, { message: 'Shops retrieved successfully', meta: { count: shops.length } });
    } catch (error: any) {
      req.log?.error({ err: error }, 'shop:list failed');
      if (error.status) {
        return failureCode(res, error.status, ErrorCodes.GET_SHOPS_FAILED, undefined, error.message);
      }
      return failureCode(res, 500, ErrorCodes.GET_SHOPS_FAILED, undefined, error.message || 'Failed to fetch shops');
    }
  }

  async getShopById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const shopId = parseId(id, 'shop id');
      const shop = await this.shopService.getShopById(shopId, req.user);
      
      if (!shop) {
        return failureCode(res, 404, ErrorCodes.SHOP_NOT_FOUND_ERROR, undefined, 'Shop not found');
      }
      return success(res, shop, { message: 'Shop retrieved successfully' });
    } catch (error: any) {
      req.log?.error({ err: error }, 'shop:get failed');
      if (error.status) {
        return failureCode(res, error.status, ErrorCodes.GET_SHOP_FAILED, undefined, error.message);
      }
      return failureCode(res, 500, ErrorCodes.GET_SHOP_FAILED, undefined, error.message || 'Failed to fetch shop');
    }
  }

  async updateShop(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const shopId = parseId(id, 'shop id');
      const shop = await this.shopService.updateShop(shopId, req.body, req.user);
      if (!shop) {
        return failureCode(res, 404, ErrorCodes.SHOP_NOT_FOUND_ERROR, undefined, 'Shop not found');
      }
      return success(res, shop, { message: 'Shop updated successfully' });
    } catch (error: any) {
      req.log?.error({ err: error }, 'shop:update failed');
      if (error.status) {
        return failureCode(res, error.status, ErrorCodes.UPDATE_SHOP_FAILED, undefined, error.message);
      }
      return failureCode(res, 500, ErrorCodes.UPDATE_SHOP_FAILED, undefined, error.message || 'Failed to update shop');
    }
  }

  async deleteShop(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const shopId = parseId(id, 'shop id');
      const deleted = await this.shopService.deleteShop(shopId, req.user);
      if (!deleted) {
        return failureCode(res, 404, ErrorCodes.SHOP_NOT_FOUND_ERROR, undefined, 'Shop not found');
      }
  return standardDelete(res, shopId, 'shop');
    } catch (error: any) {
      req.log?.error({ err: error }, 'shop:delete failed');
      if (error.status) {
        return failureCode(res, error.status, ErrorCodes.DELETE_SHOP_FAILED, undefined, error.message);
      }
      return failureCode(res, 500, ErrorCodes.DELETE_SHOP_FAILED, undefined, error.message || 'Failed to delete shop');
    }
  }

  async updateCommissionRate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { commission_rate } = req.body;
      
      if (!commission_rate || commission_rate < 0 || commission_rate > 100) {
        return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, undefined, 'Commission rate must be between 0 and 100');
      }

      const shopId = parseId(id, 'shop id');
      
      // Update the shop's commission rate
      const shop = await this.shopService.updateShop(shopId, { commission_rate }, req.user);
      if (!shop) {
        return failureCode(res, 404, ErrorCodes.SHOP_NOT_FOUND_ERROR, undefined, 'Shop not found');
      }

      return success(res, shop, { message: 'Commission rate updated successfully' });
    } catch (error: any) {
      req.log?.error({ err: error }, 'shop:updateCommissionRate failed');
      if (error.status) {
        return failureCode(res, error.status, ErrorCodes.UPDATE_SHOP_FAILED, undefined, error.message);
      }
      return failureCode(res, 500, ErrorCodes.UPDATE_SHOP_FAILED, undefined, error.message || 'Failed to update commission rate');
    }
  }
}
