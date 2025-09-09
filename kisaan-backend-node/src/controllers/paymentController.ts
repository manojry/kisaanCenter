import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { validationResult } from 'express-validator';
import { CreatePaymentDTO, UpdatePaymentStatusDTO } from '../dtos';

export class PaymentController {
  private paymentService = new PaymentService();

  async createPayment(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).user?.id;
      const paymentData: CreatePaymentDTO = req.body;
      
      const payment = await this.paymentService.createPayment(paymentData, userId);
      
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment recorded successfully'
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = (req as any).user?.id;
      const updateData: UpdatePaymentStatusDTO = req.body;
      
      const payment = await this.paymentService.updatePaymentStatus(Number(id), updateData, userId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment,
        message: 'Payment status updated successfully'
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPaymentsByTransaction(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const payments = await this.paymentService.getPaymentsByTransaction(Number(transactionId));

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getOutstandingPayments(req: Request, res: Response) {
    try {
      const { shopId } = req.query;
      const payments = await this.paymentService.getOutstandingPayments(
        shopId ? Number(shopId) : undefined
      );

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error fetching outstanding payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch outstanding payments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}