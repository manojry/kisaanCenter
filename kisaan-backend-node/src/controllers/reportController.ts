import { Request, Response } from 'express';

export const generateReport = async (req: Request, res: Response) => {
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
        // 8. Top shops (by transaction count in date range)
        const topShopsRaw = await Transaction.findAll({
          attributes: ['shop_id', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'txnCount']],
          where: { created_at: { $gte: from, $lte: to } },
          group: ['shop_id'],
          order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
          limit: 5,
          raw: true
        });
        // Get shop details for topShops
        const shopIds = topShopsRaw.map((s: any) => s.shop_id);
        const shops = await Shop.findAll({ where: { id: shopIds }, raw: true });
        const topShops = topShopsRaw.map((s: any) => {
          const shop = shops.find((sh: any) => sh.id === s.shop_id) || {};
          return {
            id: shop.id,
            name: shop.name,
            owner_id: shop.owner_id,
            status: shop.status,
            created_at: shop.createdAt,
            txnCount: s.txnCount
          };
        });
        return res.json({
          success: true,
          data: {
            totalShops,
            totalUsers,
            totalTransactions,
            totalRevenue: Number(totalRevenue) || 0,
            activeShops,
            activeUsers,
            recentTransactions,
            topShops
          }
        });
      }
      // fallback for other report_types
      return res.json({
        success: true,
        data: { report_type, date_from, date_to, scope: 'platform', message: 'Not implemented' }
      });
    }

    // For non-superadmin users, shop_id is required for shop-level reports
    if (report_type === 'shop') {
      if (!shop_id) {
        return res.status(400).json({ error: 'shop_id is required for shop-level reports' });
      }
  // Remove date filter: fetch all transactions for the shop (and optional farmer)
  const { Transaction } = require('../models/transaction');
  const { User } = require('../models/user');
  const { Payment } = require('../models/payment');
  // Optional farmer filter
  const farmer_id = req.query.farmer_id;
  // Always compare shop_id as string to match DB data
  const txnWhere: any = { shop_id: String(shop_id) };
  if (farmer_id) txnWhere.farmer_id = farmer_id;
  console.log('[REPORT DEBUG] shop_id:', shop_id, 'txnWhere:', txnWhere);
  const transactions = await Transaction.findAll({ where: txnWhere, raw: true });
  console.log('[REPORT DEBUG] transactions found:', transactions.length);
      // Get all user IDs for buyers and farmers
      const buyerIds = [...new Set(transactions.map((t: any) => t.buyer_id))];
      const farmerIds = [...new Set(transactions.map((t: any) => t.farmer_id))];
      const users = await User.findAll({ where: { id: [...buyerIds, ...farmerIds] }, raw: true });
      // Map user IDs to names
      const userMap: Record<number, any> = {};
      users.forEach((u: any) => { userMap[u.id] = u; });
      // Get all transaction IDs
      const txnIds = transactions.map((t: any) => t.id);
      // Get all payments for these transactions
      const payments = await Payment.findAll({ where: { transaction_id: txnIds, status: 'PAID' }, raw: true });
      // Map transaction_id to total paid
      const paidMap: Record<number, number> = {};
      payments.forEach((p: any) => {
        paidMap[p.transaction_id] = (paidMap[p.transaction_id] || 0) + Number(p.amount || 0);
      });
      // Build report rows
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
  // Totals
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
    }
    // fallback for other report_types
    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required for shop-level reports' });
    }
    if (!report_type || !['farmer', 'user'].includes(report_type as string)) {
      return res.status(400).json({ error: 'report_type must be farmer or user' });
    }
    if ((report_type === 'farmer' || report_type === 'user') && !user_id) {
      return res.status(400).json({ error: 'user_id is required for farmer and user reports' });
    }
    // fallback shop-level report
    const reportData = {
      shop_id,
      user_id,
      date_from,
      date_to,
      report_type,
      scope: 'shop',
      message: 'Shop-level report generation not fully implemented yet'
    };
    res.json({
      success: true,
      data: reportData
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    });
  }
};

export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { shop_id, user_id, date_from, date_to, report_type } = req.query;
    const userRole = (req as any).user?.role;

    // Superadmin can download platform-wide reports
    if (userRole === 'superadmin') {
      if (!report_type || !['platform', 'shops', 'users', 'transactions'].includes(report_type as string)) {
        return res.status(400).json({ error: 'report_type must be platform, shops, users, or transactions for superadmin' });
      }
      
      const reportData = {
        report_type,
        date_from,
        date_to,
        scope: 'platform',
        message: 'Platform-wide report download not fully implemented yet'
      };
      
      return res.json({
        success: true,
        data: reportData
      });
    }

    // For non-superadmin users, shop_id is required
    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required for shop-level reports' });
    }

    if (!report_type || !['farmer', 'user', 'shop'].includes(report_type as string)) {
      return res.status(400).json({ error: 'report_type must be farmer, user, or shop' });
    }

    if ((report_type === 'farmer' || report_type === 'user') && !user_id) {
      return res.status(400).json({ error: 'user_id is required for farmer and user reports' });
    }

    // Shop-level download (CSV)
    if (report_type === 'shop') {
      if (!shop_id) {
        return res.status(400).json({ error: 'shop_id is required for shop-level reports' });
      }
  // Remove date filter: fetch all transactions for the shop (and optional farmer)
  const { Transaction } = require('../models/transaction');
  const { User } = require('../models/user');
  const { Payment } = require('../models/payment');
  const { Shop } = require('../models/shop');
  const PDFDocument = require('pdfkit');
  const fs = require('fs');
  // Optional farmer filter
  const farmer_id = req.query.farmer_id;
  // Find all transactions for this shop (and farmer if provided)
  const txnWhere: any = { shop_id: shop_id };
  if (farmer_id) txnWhere.farmer_id = farmer_id;
  const transactions = await Transaction.findAll({ where: txnWhere, raw: true });
      // Get all user IDs for buyers and farmers
      const buyerIds = [...new Set(transactions.map((t: any) => t.buyer_id))];
      const farmerIds = [...new Set(transactions.map((t: any) => t.farmer_id))];
      const users = await User.findAll({ where: { id: [...buyerIds, ...farmerIds] }, raw: true });
      // Map user IDs to names
      const userMap: Record<number, any> = {};
      users.forEach((u: any) => { userMap[u.id] = u; });
      // Get all transaction IDs
      const txnIds = transactions.map((t: any) => t.id);
      // Get all payments for these transactions
      const payments = await Payment.findAll({ where: { transaction_id: txnIds, status: 'PAID' }, raw: true });
      // Map transaction_id to total paid
      const paidMap: Record<number, number> = {};
      payments.forEach((p: any) => {
        paidMap[p.transaction_id] = (paidMap[p.transaction_id] || 0) + Number(p.amount || 0);
      });
      // Build report rows
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
      // Totals
  // (Removed duplicate total_amount and total_paid to avoid redeclaration)
      // Get shop name
      const shop = await Shop.findByPk(shop_id);
      // PDF generation
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="shop_report.pdf"');
      doc.pipe(res);
      // Logo (use a placeholder if logo file not available)
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

  // Add legend/explanation section
  doc.font('Helvetica-Bold').fontSize(11).text('Report Legend:', { align: 'left' });
  doc.font('Helvetica').fontSize(10);
  doc.text('Txn ID: Transaction ID', { continued: true }).text('   Buyer: Buyer Name', { continued: true }).text('   Farmer: Farmer Name');
  doc.text('Product: Product Name', { continued: true }).text('   Qty: Quantity Sold', { continued: true }).text('   Unit Price: Price per Unit');
  doc.text('Total: Total Sale Value', { continued: true }).text('   Commission: Shop Commission', { continued: true }).text('   Farmer Net: Farmer Net Earning');
  doc.text('Buyer Paid: Amount Paid by Buyer', { continued: true }).text('   Farmer Paid: Amount Paid to Farmer');
  doc.text('Deficit: Amount Buyer Still Owes', { continued: true }).text('   Farmer Due: Amount Still Owed to Farmer');
  doc.moveDown();

      // Table layout
      // Enhanced table layout
      const tableTop = doc.y;
  // Group columns: Sale Info | Payment Info
  const colWidths = [36, 60, 60, 60, 40, 55, 60, 60, 60];
  // Two-line header for clarity
  const headersTop = ['Txn', 'Sale Info', '', '', '', '', 'Payment Info', '', ''];
  const headersBottom = ['ID', 'Product', 'Qty', 'Unit', 'Total', 'Commission', 'Farmer Net', 'Buyer Paid', 'Due'];
      let x = 40;
      let y = tableTop;

      // Draw header background
      doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), 52).fillAndStroke('#f0f0f0', '#000');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(13);
      let colX = x;
      headersTop.forEach((header, i) => {
        doc.text(header, colX + 2, y + 6, { width: colWidths[i] - 4, align: 'center' });
        colX += colWidths[i];
      });
      colX = x;
      headersBottom.forEach((header, i) => {
        doc.text(header, colX + 2, y + 30, { width: colWidths[i] - 4, align: 'center' });
        colX += colWidths[i];
      });
      y += 52;
      // Insert empty row for visual separation
      doc.font('Helvetica').fontSize(12);
      doc.fillColor('#fff');
      doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), 18).fill();
      y += 18;
      // Draw rows
      rows.forEach((r: any, idx: number) => {
        colX = x;
        if (idx % 2 === 0) {
          doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), 28).fill('#fafafa');
        }
        doc.fillColor('#000');
        doc.font('Helvetica').fontSize(13);
        // Only show key info, truncate long text
        doc.text(String(r.transaction_id), colX + 2, y + 8, { width: colWidths[0] - 4, align: 'center' }); colX += colWidths[0];
        doc.text(String(r.product).slice(0, 12), colX + 2, y + 8, { width: colWidths[1] - 4, align: 'center' }); colX += colWidths[1];
        doc.text(String(r.quantity), colX + 2, y + 8, { width: colWidths[2] - 4, align: 'center' }); colX += colWidths[2];
        doc.text(String(r.unit_price), colX + 2, y + 8, { width: colWidths[3] - 4, align: 'center' }); colX += colWidths[3];
        doc.text(String(r.total_amount), colX + 2, y + 8, { width: colWidths[4] - 4, align: 'center' }); colX += colWidths[4];
        doc.text(String(r.shop_commission), colX + 2, y + 8, { width: colWidths[5] - 4, align: 'center' }); colX += colWidths[5];
        doc.text(String(r.farmer_earning), colX + 2, y + 8, { width: colWidths[6] - 4, align: 'center' }); colX += colWidths[6];
        doc.text(String(r.buyer_paid), colX + 2, y + 8, { width: colWidths[7] - 4, align: 'center' }); colX += colWidths[7];
        doc.text(String(r.farmer_due), colX + 2, y + 8, { width: colWidths[8] - 4, align: 'center' }); colX += colWidths[8];
        doc.moveTo(x, y).lineTo(x + colWidths.reduce((a, b) => a + b, 0), y).stroke('#ccc');
        y += 28;
        // Add page break if needed
        if (y > doc.page.height - 180) {
          doc.addPage();
          y = 60;
        }
      });
      // Draw bottom border
      doc.moveTo(x, y).lineTo(x + colWidths.reduce((a, b) => a + b, 0), y).stroke('#000');

      // Totals row
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Totals', x + 2, y + 4, { width: colWidths.slice(0, 9).reduce((a, b) => a + b, 0) - 12, align: 'right' });
  const summary_total_amount = rows.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);
  const summary_total_commission = rows.reduce((sum: number, r: any) => sum + (r.shop_commission || 0), 0);
  const summary_total_earning = rows.reduce((sum: number, r: any) => sum + (r.farmer_earning || 0), 0);
  const summary_total_buyer_paid = rows.reduce((sum: number, r: any) => sum + (r.buyer_paid || 0), 0);
  const summary_total_farmer_paid = rows.reduce((sum: number, r: any) => sum + (r.farmer_paid || 0), 0);
  const summary_total_deficit = rows.reduce((sum: number, r: any) => sum + (r.deficit || 0), 0);
  const summary_total_farmer_due = rows.reduce((sum: number, r: any) => sum + (r.farmer_due || 0), 0);
  doc.text(String(summary_total_amount), x + colWidths.slice(0, 6).reduce((a, b) => a + b, 0) + 2, y + 4, { width: colWidths[6] - 4, align: 'center' });
  doc.text(String(summary_total_commission), x + colWidths.slice(0, 7).reduce((a, b) => a + b, 0) + 2, y + 4, { width: colWidths[7] - 4, align: 'center' });
  doc.text(String(summary_total_earning), x + colWidths.slice(0, 8).reduce((a, b) => a + b, 0) + 2, y + 4, { width: colWidths[8] - 4, align: 'center' });
  doc.text(String(summary_total_buyer_paid), x + colWidths.slice(0, 9).reduce((a, b) => a + b, 0) + 2, y + 4, { width: colWidths[9] - 4, align: 'center' });
  doc.text(String(summary_total_farmer_paid), x + colWidths.slice(0, 10).reduce((a, b) => a + b, 0) + 2, y + 4, { width: colWidths[10] - 4, align: 'center' });
  doc.text(String(summary_total_deficit), x + colWidths.slice(0, 11).reduce((a, b) => a + b, 0) + 2, y + 4, { width: colWidths[11] - 4, align: 'center' });
  doc.text(String(summary_total_farmer_due), x + colWidths.slice(0, 12).reduce((a, b) => a + b, 0) + 2, y + 4, { width: colWidths[12] - 4, align: 'center' });
  doc.font('Helvetica').fontSize(10);
  y += 20;

      // Summary section
  // Improved summary section with box and aligned values
      y += 20;
      const summaryX = x;
      const summaryY = y;
      const summaryWidth = 370;
      const summaryHeight = 120;
      // Draw summary box
      doc.rect(summaryX, summaryY, summaryWidth, summaryHeight).stroke('#333');
      doc.font('Helvetica-Bold').fontSize(13).text('Summary', summaryX + 16, summaryY + 16);
      doc.font('Helvetica').fontSize(11);
      // Add summary note for clarity
      doc.font('Helvetica-Oblique').fontSize(9).text(
        'Totals represent the sum of all transactions in this report. "Farmer Net" is the net earning for farmers after commission. "Deficit" is what buyers still owe. "Farmer Due" is what is still owed to farmers.',
        summaryX + 16, summaryY + summaryHeight - 22, { width: summaryWidth - 32, align: 'left' }
      );
      const labelX = summaryX + 30;
      const valueX = summaryX + 200;
      let lineY = summaryY + 45;
      const lineGap = 20;
      const summaryRows = [
        ['Total Transactions:', String(rows.length)],
        ['Total Sales:', String(summary_total_amount)],
        ['Total Buyer Paid:', String(summary_total_buyer_paid)],
        ['Total Farmer Paid:', String(summary_total_farmer_paid)],
        ['Total Deficit:', String(summary_total_deficit)],
        ['Total Shop Commission:', String(summary_total_commission)],
        ['Total Farmer Earnings:', String(summary_total_earning)],
        ['Total Farmer Due:', String(summary_total_farmer_due)]
      ];
      summaryRows.forEach(([label, value]) => {
        doc.text(label, labelX, lineY, { width: 150, align: 'left' });
        doc.text(value, valueX, lineY, { width: 120, align: 'right' });
        lineY += lineGap;
      });

      doc.end();
      return;
    }

  } catch (error: any) {
    console.error('Error downloading report:', error);
    res.status(500).json({ 
      error: 'Failed to download report',
      message: error.message 
    });
  }
};