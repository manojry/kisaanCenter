import { Request, Response } from 'express';

class ReportController {
  async generateReport(req: Request, res: Response) {
    try {
      const { shop_id, user_id, date_from, date_to, report_type, format = 'json' } = req.query;
      const userRole = (req as any).user?.role;

      // Superadmin can generate platform-wide reports without shop_id
      if (userRole === 'superadmin') {
        if (!report_type || !['platform', 'shops', 'users', 'transactions'].includes(report_type as string)) {
          return res.status(400).json({ error: 'report_type must be platform, shops, users, or transactions for superadmin' });
        }
        if (report_type === 'platform') {
          // Parse date range
          const from = date_from ? new Date(date_from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const to = date_to ? new Date(date_to as string) : new Date();

          // Import models here to avoid circular deps
          const { Shop } = require('../models/shop');
          const { User } = require('../models/user');
          const { Transaction } = require('../models/transaction');
          // 1. Total shops
          const totalShops = await Shop.count();
          // 2. Active shops
          const activeShops = await Shop.count({ where: { status: 'active' } });
          // 3. Total users
          const totalUsers = await User.count();
          // 4. Active users
          const activeUsers = await User.count({ where: { status: 'active' } });
          // 5. Total transactions (in date range)
          const totalTransactions = await Transaction.count({ where: { created_at: { $gte: from, $lte: to } } });
          // 6. Total revenue (sum of total_sale_value in date range)
          const { sum: totalRevenue } = await Transaction.findOne({
            attributes: [[require('sequelize').fn('SUM', require('sequelize').col('total_sale_value')), 'sum']],
            where: { created_at: { $gte: from, $lte: to } },
            raw: true
          }) || { sum: 0 };
          // 7. Recent transactions (last 10)
          const recentTransactions = await Transaction.findAll({
            order: [['created_at', 'DESC']],
            limit: 10,
            raw: true
          });

          return res.json({
            report_type,
            date_from: from,
            date_to: to,
            total_shops: totalShops,
            active_shops: activeShops,
            total_users: totalUsers,
            active_users: activeUsers,
            total_transactions: totalTransactions,
            total_revenue: totalRevenue,
            recent_transactions: recentTransactions
          });
        }
      } else if (userRole === 'admin' || userRole === 'staff') {
        if (!shop_id) {
          return res.status(400).json({ error: 'shop_id is required for admin and staff users' });
        }
        // For admin and staff, we can generate shop-specific reports
        const { Transaction } = require('../models/transaction');
        const { User } = require('../models/user');
        const { Payment } = require('../models/payment');
        // Optional farmer filter
        const farmer_id = req.query.farmer_id;
        const txnWhere: any = { shop_id: String(shop_id) };
        if (farmer_id) txnWhere.farmer_id = farmer_id;
        const transactions = await Transaction.findAll({ where: txnWhere, raw: true });
        const buyerIds = [...new Set(transactions.map((t: any) => t.buyer_id))];
        const farmerIds = [...new Set(transactions.map((t: any) => t.farmer_id))];
        const users = await User.findAll({ where: { id: [...buyerIds, ...farmerIds] }, raw: true });
        const userMap: Record<number, any> = {};
        users.forEach((u: any) => { userMap[u.id] = u; });
        const txnIds = transactions.map((t: any) => t.id);
        const payments = await Payment.findAll({ where: { transaction_id: txnIds, status: 'PAID' }, raw: true });
        const paidMap: Record<number, number> = {};
        payments.forEach((p: any) => {
          paidMap[p.transaction_id] = (paidMap[p.transaction_id] || 0) + Number(p.amount || 0);
        });
        const rows = transactions.map((t: any) => ({
          transaction_id: t.id,
          buyer: userMap[t.buyer_id]?.username || t.buyer_id,
          farmer: userMap[t.farmer_id]?.username || t.farmer_id,
          product: t.product_name,
          quantity: Number(t.quantity),
          unit_price: Number(t.unit_price),
          total_amount: Number(t.total_sale_value),
          paid_amount: Number(paidMap[t.id] || 0)
        }));
        const total_amount = rows.reduce((sum: number, r: any) => sum + r.total_amount, 0);
        const total_paid = rows.reduce((sum: number, r: any) => sum + r.paid_amount, 0);
        return res.json({
          success: true,
          data: {
            rows,
            total_amount,
            total_paid
          }
        });
      } else {
        return res.status(403).json({ error: 'Insufficient permissions to generate this report' });
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report', message: error.message });
    }
  }

  async downloadReport(req: Request, res: Response) {
    try {
      const { shop_id, user_id, date_from, date_to, report_type } = req.query;
      const userRole = (req as any).user?.role;

      // Superadmin can download platform-wide reports without shop_id
      if (userRole === 'superadmin') {
        if (!report_type || !['platform', 'shops', 'users', 'transactions'].includes(report_type as string)) {
          return res.status(400).json({ error: 'report_type must be platform, shops, users, or transactions for superadmin' });
        }
        if (report_type === 'platform') {
          // Logic for superadmin to download platform-wide report
          // ...existing code for CSV/Excel download...
        }
      } else if (userRole === 'admin' || userRole === 'staff') {
        if (!shop_id) {
          return res.status(400).json({ error: 'shop_id is required for admin and staff users' });
        }
        // For admin and staff, we can generate shop-specific downloads
        const { Transaction } = require('../models/transaction');
        const { User } = require('../models/user');
        const { Payment } = require('../models/payment');
        const { Shop } = require('../models/shop');
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const farmer_id = req.query.farmer_id;
        const txnWhere: any = { shop_id: shop_id };
        if (farmer_id) txnWhere.farmer_id = farmer_id;
        const transactions = await Transaction.findAll({ where: txnWhere, raw: true });
        const buyerIds = [...new Set(transactions.map((t: any) => t.buyer_id))];
        const farmerIds = [...new Set(transactions.map((t: any) => t.farmer_id))];
        const users = await User.findAll({ where: { id: [...buyerIds, ...farmerIds] }, raw: true });
        const userMap: Record<number, any> = {};
        users.forEach((u: any) => { userMap[u.id] = u; });
        const txnIds = transactions.map((t: any) => t.id);
        const payments = await Payment.findAll({ where: { transaction_id: txnIds, status: 'PAID' }, raw: true });
        const paidMap: Record<number, number> = {};
        payments.forEach((p: any) => {
          paidMap[p.transaction_id] = (paidMap[p.transaction_id] || 0) + Number(p.amount || 0);
        });
        const rows = transactions.map((t: any) => ({
          transaction_id: t.id,
          buyer: t.buyer?.username || userMap[t.buyer_id]?.username || t.buyer_id,
          farmer: t.farmer?.username || userMap[t.farmer_id]?.username || t.farmer_id,
          product: t.product_name,
          quantity: Number(t.quantity),
          unit_price: Number(t.unit_price),
          total_amount: Number(t.total_sale_value),
          shop_commission: Number(t.shop_commission),
          farmer_earning: Number(t.farmer_earning),
          buyer_paid: t.buyer_paid !== undefined ? Number(t.buyer_paid) : Number(paidMap[t.id] || 0),
          farmer_paid: t.farmer_paid !== undefined ? Number(t.farmer_paid) : 0,
          deficit: t.deficit !== undefined ? Number(t.deficit) : 0,
          farmer_due: t.farmer_due !== undefined ? Number(t.farmer_due) : 0,
          created_at: t.created_at,
        }));
        const shop = await Shop.findByPk(shop_id);
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="shop_report.pdf"');
        doc.pipe(res);
        const logoPath = __dirname + '/../../assets/kisaan-logo.png';
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, doc.page.width/2 - 50, 20, { width: 100 });
        }
        doc.moveDown(logoPath ? 2 : 4);
        doc.fontSize(18).text('Kisaan Center', { align: 'center' });
        doc.fontSize(12).fillColor('blue').text('kisaancenter.com', { align: 'center', link: 'https://kisaancenter.com' });
        doc.moveDown();
        doc.fontSize(14).fillColor('black').text(`Shop: ${shop?.name || shop_id}`, { align: 'left' });
        doc.fontSize(12).text('Date Range: All Time');
        doc.moveDown();
        // ...rest of PDF generation logic...
        doc.end();
        return;
      } else {
        return res.status(403).json({ error: 'Insufficient permissions to download this report' });
      }
    } catch (error: any) {
      console.error('Error downloading report:', error);
      res.status(500).json({ error: 'Failed to download report', message: error.message });
    }
  }
}

const reportController = new ReportController();
export { reportController };
export const generateReport = reportController.generateReport.bind(reportController);
export const downloadReport = reportController.downloadReport.bind(reportController);
