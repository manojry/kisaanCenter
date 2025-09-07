import { Request, Response } from 'express';
import { generateReportData, generatePDFHTML } from '../services/pdfService';

export const generateReport = async (req: Request, res: Response) => {
  try {
    const { shop_id, user_id, date_from, date_to, report_type, format = 'json' } = req.query;

    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required' });
    }

    if (!report_type || !['farmer', 'user', 'shop'].includes(report_type as string)) {
      return res.status(400).json({ error: 'report_type must be farmer, user, or shop' });
    }

    if ((report_type === 'farmer' || report_type === 'user') && !user_id) {
      return res.status(400).json({ error: 'user_id is required for farmer and user reports' });
    }

    const reportData = await generateReportData({
      shop_id: shop_id as string,
      user_id: user_id as string,
      date_from: date_from as string,
      date_to: date_to as string,
      report_type: report_type as 'farmer' | 'user' | 'shop'
    });

    if (format === 'pdf') {
      const htmlContent = generatePDFHTML(reportData);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="${report_type}-report.html"`);
      return res.send(htmlContent);
    }

    // Return JSON data
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

    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id is required' });
    }

    if (!report_type || !['farmer', 'user', 'shop'].includes(report_type as string)) {
      return res.status(400).json({ error: 'report_type must be farmer, user, or shop' });
    }

    if ((report_type === 'farmer' || report_type === 'user') && !user_id) {
      return res.status(400).json({ error: 'user_id is required for farmer and user reports' });
    }

    const reportData = await generateReportData({
      shop_id: shop_id as string,
      user_id: user_id as string,
      date_from: date_from as string,
      date_to: date_to as string,
      report_type: report_type as 'farmer' | 'user' | 'shop'
    });

    const htmlContent = generatePDFHTML(reportData);
    
    const filename = `${report_type}-report-${Date.now()}.html`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(htmlContent);

  } catch (error: any) {
    console.error('Error downloading report:', error);
    res.status(500).json({ 
      error: 'Failed to download report',
      message: error.message 
    });
  }
};