import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { CreateTransactionDTO } from '../dtos';

export class TransactionController {
  /**
   * GET /buyers/:buyerId/purchases - All transactions for a buyer, with optional date filtering and aggregation
   */
  async getPurchasesByBuyer(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;
      const { startDate, endDate } = req.query;
      const filters: any = { buyerId: Number(buyerId) };
      if (startDate && endDate) {
        filters.startDate = new Date(startDate as string);
        filters.endDate = new Date(endDate as string);
      }
      const transactions = await this.transactionService.getTransactionsByBuyer(Number(buyerId), filters);
      // Aggregate total purchase value
      const totalPurchases = transactions.length;
      const totalSpent = transactions.reduce((sum, t) => sum + Number(t.total_sale_value), 0);
      res.json({ success: true, data: { totalPurchases, totalSpent, transactions } });
    } catch (error) {
      console.error('Error fetching purchases by buyer:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch purchases by buyer', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  private transactionService = new TransactionService();

  async createTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const transactionData: CreateTransactionDTO = req.body;
      
      const transaction = await this.transactionService.createTransaction(transactionData, userId);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const transaction = await this.transactionService.getTransactionById(Number(id));
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTransactionsByShop(req: Request, res: Response) {
    try {
      const { shopId } = req.params;
      const { startDate, endDate, farmerId, buyerId } = req.query;
      
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        farmerId: farmerId ? Number(farmerId) : undefined,
        buyerId: buyerId ? Number(buyerId) : undefined
      };
      
      const transactions = await this.transactionService.getTransactionsByShop(Number(shopId), filters);

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getShopEarnings(req: Request, res: Response) {
    try {
      const { shopId } = req.params;
      const { startDate, endDate } = req.query;
      
      const period = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      
      const earnings = await this.transactionService.getShopEarnings(Number(shopId), period);

      res.json({
        success: true,
        data: earnings
      });
    } catch (error) {
      console.error('Error fetching shop earnings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shop earnings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getFarmerEarnings(req: Request, res: Response) {
    try {
      const { farmerId } = req.params;
      const { shopId, startDate, endDate } = req.query;
      
      const period = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;
      
      const earnings = await this.transactionService.getFarmerEarnings(
        Number(farmerId),
        shopId ? Number(shopId) : undefined,
        period
      );

      res.json({
        success: true,
        data: earnings
      });
    } catch (error) {
      console.error('Error fetching farmer earnings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch farmer earnings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}