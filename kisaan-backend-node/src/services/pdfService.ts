import { getTransactions } from './transactionService';
import { User } from '../models/user';
import { Shop } from '../models/shop';

interface PDFReportData {
  reportType: 'farmer' | 'user' | 'shop';
  shopId: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  transactions: any[];
  analytics: any;
  userInfo?: any;
  shopInfo?: any;
}

export const generateReportData = async (filters: {
  shop_id: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  report_type: 'farmer' | 'user' | 'shop';
}): Promise<PDFReportData> => {
  
  // Get shop information
  const shop = await Shop.findByPk(filters.shop_id);
  if (!shop) {
    throw new Error('Shop not found');
  }

  // Build transaction filters
  const transactionFilters: any = {
    shop_id: filters.shop_id,
    include_analytics: 'true'
  };

  if (filters.date_from) transactionFilters.date_from = filters.date_from;
  if (filters.date_to) transactionFilters.date_to = filters.date_to;

  // Add user-specific filter for farmer/user reports
  if (filters.report_type === 'farmer' && filters.user_id) {
    // For farmer reports, filter by farmer_id in transactions
    transactionFilters.farmer_id = filters.user_id;
    const { transactions, analytics } = await getTransactions(transactionFilters);
    
    // Calculate farmer-specific analytics
    const farmerAnalytics = {
      ...analytics,
      farmer_paid: transactions.reduce((sum, t) => sum + t.farmer_paid, 0),
      farmer_due: transactions.reduce((sum, t) => sum + (t.total - t.commission_amount - t.farmer_paid), 0)
    };

    const userInfo = await User.findByPk(filters.user_id);
    
    return {
      reportType: 'farmer',
      shopId: filters.shop_id,
      userId: filters.user_id,
      dateFrom: filters.date_from,
      dateTo: filters.date_to,
      transactions,
      analytics: farmerAnalytics,
      userInfo,
      shopInfo: shop
    };
  }

  if (filters.report_type === 'user' && filters.user_id) {
    // For user reports, filter by buyer_id in transactions
    transactionFilters.buyer_id = filters.user_id;
    const { transactions, analytics } = await getTransactions(transactionFilters);
    const userInfo = await User.findByPk(filters.user_id);
    
    return {
      reportType: 'user',
      shopId: filters.shop_id,
      userId: filters.user_id,
      dateFrom: filters.date_from,
      dateTo: filters.date_to,
      transactions,
      analytics,
      userInfo,
      shopInfo: shop
    };
  }

  // For shop reports, get all transactions
  const { transactions, analytics } = await getTransactions(transactionFilters);
  
  return {
    reportType: 'shop',
    shopId: filters.shop_id,
    dateFrom: filters.date_from,
    dateTo: filters.date_to,
    transactions,
    analytics,
    shopInfo: shop
  };
};

export const generatePDFHTML = (data: PDFReportData): string => {
  const { reportType, transactions, analytics, userInfo, shopInfo, dateFrom, dateTo } = data;
  
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN');
  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;
  
  const dateRange = dateFrom && dateTo 
    ? `${formatDate(dateFrom)} to ${formatDate(dateTo)}`
    : 'All Time';

  const reportTitle = reportType === 'farmer' 
    ? `Farmer Report - ${userInfo?.username || 'Unknown'}`
    : reportType === 'user'
    ? `User Report - ${userInfo?.username || 'Unknown'}`
    : `Shop Report - ${shopInfo?.name || 'Unknown'}`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${reportTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #4CAF50; margin: 0; }
        .header h2 { color: #666; margin: 5px 0; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .info-box { background: #f9f9f9; padding: 15px; border-radius: 5px; width: 48%; }
        .info-box h3 { margin-top: 0; color: #4CAF50; }
        .summary { background: #e8f5e8; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
        .summary h3 { margin-top: 0; color: #2e7d32; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .summary-item { background: white; padding: 15px; border-radius: 5px; text-align: center; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #2e7d32; }
        .summary-item .label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.paid { background: #4CAF50; color: white; }
        .status.pending { background: #FF9800; color: white; }
        .status.credit { background: #2196F3; color: white; }
        .status.partial { background: #9C27B0; color: white; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌾 KisaanCenter</h1>
        <h2>${reportTitle}</h2>
        <p>Period: ${dateRange}</p>
        <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
    </div>

    <div class="info-section">
        <div class="info-box">
            <h3>Shop Information</h3>
            <p><strong>Name:</strong> ${shopInfo?.name || 'N/A'}</p>
            <p><strong>Address:</strong> ${shopInfo?.address || 'N/A'}</p>
            <p><strong>Commission Rate:</strong> ${shopInfo?.commission_rate || 10}%</p>
        </div>
        ${userInfo ? `
        <div class="info-box">
            <h3>${reportType === 'farmer' ? 'Farmer' : 'User'} Information</h3>
            <p><strong>Name:</strong> ${userInfo.username}</p>
            <p><strong>Role:</strong> ${userInfo.role}</p>
            <p><strong>Phone:</strong> ${userInfo.phone || 'N/A'}</p>
        </div>
        ` : ''}
    </div>

    <div class="summary">
        <h3>Summary</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="value">${analytics?.total_transactions || 0}</div>
                <div class="label">Total Transactions</div>
            </div>
            <div class="summary-item">
                <div class="value">${formatCurrency(analytics?.total_sales || 0)}</div>
                <div class="label">Total Sales</div>
            </div>
            <div class="summary-item">
                <div class="value">${formatCurrency(analytics?.total_commission || 0)}</div>
                <div class="label">Commission</div>
            </div>
            ${reportType === 'farmer' ? `
            <div class="summary-item">
                <div class="value">${formatCurrency(analytics?.farmer_paid || 0)}</div>
                <div class="label">Amount Paid</div>
            </div>
            <div class="summary-item">
                <div class="value">${formatCurrency(analytics?.farmer_due || 0)}</div>
                <div class="label">Amount Due</div>
            </div>
            ` : ''}
        </div>
    </div>

    <h3>Transaction Details</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Product</th>
                ${reportType !== 'farmer' ? '<th>Farmer</th>' : ''}
                ${reportType !== 'user' ? '<th>Buyer</th>' : ''}
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Commission</th>
                ${reportType === 'farmer' ? '<th>Paid</th><th>Due</th>' : ''}
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${transactions.map(t => `
            <tr>
                <td>${formatDate(t.transaction_date)}</td>
                <td>${t.product_name}</td>
                ${reportType !== 'farmer' ? `<td>${t.farmer_name}</td>` : ''}
                ${reportType !== 'user' ? `<td>${t.buyer_name}</td>` : ''}
                <td>${t.quantity}</td>
                <td>${formatCurrency(t.price)}</td>
                <td>${formatCurrency(t.total)}</td>
                <td>${formatCurrency(t.commission_amount)}</td>
                ${reportType === 'farmer' ? `
                <td>${formatCurrency(t.farmer_paid)}</td>
                <td>${formatCurrency(t.total - t.commission_amount - t.farmer_paid)}</td>
                ` : ''}
                <td><span class="status ${t.status}">${t.status.toUpperCase()}</span></td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated by KisaanCenter - Agricultural Management System</p>
        <p>For support, contact: support@kisaancenter.com</p>
    </div>
</body>
</html>`;
};