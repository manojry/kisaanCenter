import { Request, Response } from 'express';
import { CommissionService } from '../services/commissionService';
import { CreateCommissionDTO, UpdateCommissionDTO } from '../dtos/CommissionDTO';

export class CommissionController {
  private commissionService = new CommissionService();

  async createCommission(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const commissionData: CreateCommissionDTO = req.body;
      if (!commissionData.shop_id || !commissionData.rate || !commissionData.type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['shop_id', 'rate', 'type']
        });
      }
      const commission = await this.commissionService.createCommission(commissionData, userId);
      res.status(201).json({
        success: true,
        data: commission,
        message: 'Commission created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create commission',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCommissionsByShop(req: Request, res: Response) {
    try {
      const { shopId } = req.params;
      const commissions = await this.commissionService.getCommissionsByShop(Number(shopId));

      res.json({
        success: true,
        data: commissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch commissions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateCommission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const updateData: UpdateCommissionDTO = req.body;
      
      const commission = await this.commissionService.updateCommission(Number(id), updateData, userId);
      
      if (!commission) {
        return res.status(404).json({
          success: false,
          message: 'Commission not found'
        });
      }

      res.json({
        success: true,
        data: commission,
        message: 'Commission updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update commission',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}