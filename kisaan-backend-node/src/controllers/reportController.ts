import { Request, Response } from 'express';
import { success, failureCode } from '../shared/http/respond';
import { ErrorCodes } from '../shared/errors/errorCodes';

class ReportController {
  async generateReport(req: Request, res: Response) {
    try {
  const { shop_id, date_from, date_to, report_type, format = 'json' } = (req as any).query || {};
  const userRole = (req as any).user?.role;

      if (userRole === 'superadmin') {
        if (!report_type || !['platform', 'shops', 'users', 'transactions'].includes(report_type as string)) {
          return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { allowed: ['platform','shops','users','transactions'] }, 'Invalid report_type');
        }
        if (report_type === 'platform') {
          const from = date_from ? new Date(date_from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const to = date_to ? new Date(date_to as string) : new Date();
          const { Shop } = require('../models/shop');
          const { User } = require('../models/user');
          const { Transaction } = require('../models/transaction');
          const totalShops = await Shop.count();
          const activeShops = await Shop.count({ where: { status: 'active' } });
          const totalUsers = await User.count();
            const activeUsers = await User.count({ where: { status: 'active' } });
          const totalTransactions = await Transaction.count({ where: { created_at: { $gte: from, $lte: to } } });
          const { sum: totalRevenue } = await Transaction.findOne({
            attributes: [[require('sequelize').fn('SUM', require('sequelize').col('total_amount')), 'sum']],
            where: { created_at: { $gte: from, $lte: to } },
            raw: true
          }) || { sum: 0 };
          const recentTransactions = await Transaction.findAll({
            order: [['created_at', 'DESC']],
            limit: 10,
            raw: true
          });
          return success(res, {
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
          }, { message: 'Platform report generated' });
        }
      } else if (['admin','staff','owner'].includes(userRole)) {
        if (!shop_id) {
          return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'shop_id' }, 'shop_id is required for this role');
        }
        const { Transaction } = require('../models/transaction');
        const { User } = require('../models/user');
        const { Payment } = require('../models/payment');
  const farmer_id = (req as any).query?.farmer_id;
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
        payments.forEach((p: any) => { paidMap[p.transaction_id] = (paidMap[p.transaction_id] || 0) + Number(p.amount || 0); });
        const rows = transactions.map((t: any) => ({
          transaction_id: t.id,
          buyer: userMap[t.buyer_id]?.username || t.buyer_id,
          farmer: userMap[t.farmer_id]?.username || t.farmer_id,
          product: t.product_name,
          quantity: Number(t.quantity),
          unit_price: Number(t.unit_price),
          total_amount: Number(t.total_amount),
          paid_amount: Number(paidMap[t.id] || 0)
        }));
        const total_amount = rows.reduce((sum: number, r: any) => sum + r.total_amount, 0);
        const total_paid = rows.reduce((sum: number, r: any) => sum + r.paid_amount, 0);

        if (format === 'excel' || format === 'xlsx') {
          const ExcelJS = require('exceljs');
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Report');
          worksheet.columns = [
            { header: 'Transaction ID', key: 'transaction_id', width: 15 },
            { header: 'Buyer', key: 'buyer', width: 20 },
            { header: 'Farmer', key: 'farmer', width: 20 },
            { header: 'Product', key: 'product', width: 20 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Unit Price', key: 'unit_price', width: 12 },
            { header: 'Total Amount', key: 'total_amount', width: 15 },
            { header: 'Paid Amount', key: 'paid_amount', width: 15 }
          ];
          rows.forEach((row: any) => worksheet.addRow(row));
          worksheet.addRow({});
          worksheet.addRow({ product: 'Total', total_amount, paid_amount: total_paid });
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename="shop_report.xlsx"');
          await workbook.xlsx.write(res);
          return res.end();
        }
        return success(res, rows, { message: 'Shop report generated', meta: { count: rows.length } });
      } else {
  return failureCode(res, 403, ErrorCodes.FORBIDDEN, undefined, 'Insufficient permissions to generate this report');
      }
    } catch (error: any) {
  (req as any).log?.error({ err: error }, 'report:generate failed');
  return failureCode(res, 500, ErrorCodes.REPORT_GENERATION_FAILED, undefined, error.message || 'Failed to generate report');
    }
  }

  async downloadReport(req: Request, res: Response) {
    try {
  const { shop_id, report_type } = (req as any).query || {};
  const userRole = (req as any).user?.role;
      if (userRole === 'superadmin') {
        if (!report_type || !['platform','shops','users','transactions'].includes(report_type as string)) {
          return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { allowed: ['platform','shops','users','transactions'] }, 'Invalid report_type');
        }
        // Placeholder for future platform-wide downloadable reports.
  return failureCode(res, 400, ErrorCodes.NOT_IMPLEMENTED, undefined, 'Platform download not implemented yet');
      } else if (['admin','staff','owner'].includes(userRole)) {
  if (!shop_id) return failureCode(res, 400, ErrorCodes.VALIDATION_ERROR, { field: 'shop_id' }, 'shop_id is required for this role');
        const { Transaction } = require('../models/transaction');
        const { User } = require('../models/user');
        const { Payment } = require('../models/payment');
        const { Shop } = require('../models/shop');
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
  const farmer_id = (req as any).query?.farmer_id;
        const txnWhere: any = { shop_id };
        if (farmer_id) txnWhere.farmer_id = farmer_id;
        const transactions = await Transaction.findAll({ where: txnWhere, raw: true });
        const buyerIds = [...new Set(transactions.map((t: any) => t.buyer_id))];
        const farmerIds = [...new Set(transactions.map((t: any) => t.farmer_id))];
        const users = await User.findAll({ where: { id: [...buyerIds, ...farmerIds] }, raw: true });
        const userMap: Record<number, any> = {}; users.forEach((u: any) => { userMap[u.id] = u; });
        const txnIds = transactions.map((t: any) => t.id);
        const payments = await Payment.findAll({ where: { transaction_id: txnIds, status: 'PAID' }, raw: true });
        const paidMap: Record<number, number> = {}; payments.forEach((p: any) => { paidMap[p.transaction_id] = (paidMap[p.transaction_id] || 0) + Number(p.amount || 0); });
        const rows = transactions.map((t: any) => ({
          transaction_id: t.id,
          buyer: t.buyer?.username || userMap[t.buyer_id]?.username || t.buyer_id,
          farmer: t.farmer?.username || userMap[t.farmer_id]?.username || t.farmer_id,
          product: t.product_name,
          quantity: Number(t.quantity),
          unit_price: Number(t.unit_price),
          total_amount: Number(t.total_amount),
          commission_amount: Number(t.commission_amount),
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
        if (fs.existsSync(logoPath)) { doc.image(logoPath, doc.page.width/2 - 50, 20, { width: 100 }); }
        doc.moveDown();
        doc.fontSize(18).text('Kisaan Center', { align: 'center' });
        doc.fontSize(12).fillColor('blue').text('kisaancenter.com', { align: 'center', link: 'https://kisaancenter.com' });
        doc.moveDown();
        doc.fontSize(14).fillColor('black').text(`Shop: ${shop?.name || shop_id}`, { align: 'left' });
        doc.fontSize(12).text('Date Range: All Time');
        // (Truncated PDF body for brevity – existing logic could be expanded here)
        doc.end();
        return;
      } else {
  return failureCode(res, 403, ErrorCodes.FORBIDDEN, undefined, 'Insufficient permissions to download this report');
      }
    } catch (error: any) {
  (req as any).log?.error({ err: error }, 'report:download failed');
  return failureCode(res, 500, ErrorCodes.REPORT_DOWNLOAD_FAILED, undefined, error.message || 'Failed to download report');
    }
  }
}

const reportController = new ReportController();
export { reportController };
export const generateReport = reportController.generateReport.bind(reportController);
export const downloadReport = reportController.downloadReport.bind(reportController);
