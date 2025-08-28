import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { FileText, Download, Calendar, TrendingUp, DollarSign, Users } from 'lucide-react'

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [reportData, setReportData] = useState<any>({})

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      const [salesRes, financialRes, usersRes, stockRes] = await Promise.all([
        apiClient.get(`/reports/sales?period=${selectedPeriod}`),
        apiClient.get('/reports/financial'),
        apiClient.get('/users'),
        apiClient.get('/stock')
      ])
      
      setReportData({
        sales: salesRes.data,
        financial: financialRes.data,
        users: usersRes.data,
        stock: stockRes.data
      })
    } catch (error) {
      console.error('Failed to fetch report data')
    }
  }

  const reportTypes = [
    {
      title: 'Sales Report',
      description: 'Daily/monthly/yearly sales analysis',
      icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
      data: reportData.sales ? {
        revenue: `$${reportData.sales.revenue}`,
        transactions: reportData.sales.transactions,
        avgSale: `$${reportData.sales.avg_sale}`
      } : { revenue: '$0', transactions: 0, avgSale: '$0' }
    },
    {
      title: 'Financial Report',
      description: 'Profit & loss, commission earnings',
      icon: <DollarSign className="h-6 w-6 text-green-500" />,
      data: reportData.financial ? {
        profit: `$${reportData.financial.profit}`,
        commission: `$${reportData.financial.commission}`,
        expenses: `$${reportData.financial.expenses}`
      } : { profit: '$0', commission: '$0', expenses: '$0' }
    },
    {
      title: 'User Activity Report',
      description: 'Farmer and buyer performance',
      icon: <Users className="h-6 w-6 text-purple-500" />,
      data: reportData.users ? {
        total: reportData.users.length,
        farmers: reportData.users.filter((u: any) => u.role === 'farmer').length,
        buyers: reportData.users.filter((u: any) => u.role === 'buyer').length
      } : { total: 0, farmers: 0, buyers: 0 }
    },
    {
      title: 'Stock Movement Report',
      description: 'Inventory analysis and turnover',
      icon: <FileText className="h-6 w-6 text-orange-500" />,
      data: reportData.stock ? {
        totalItems: reportData.stock.length,
        totalQuantity: reportData.stock.reduce((sum: number, s: any) => sum + s.quantity, 0),
        avgQuantity: Math.round(reportData.stock.reduce((sum: number, s: any) => sum + s.quantity, 0) / reportData.stock.length || 0)
      } : { totalItems: 0, totalQuantity: 0, avgQuantity: 0 }
    },
    {
      title: 'Credit Report',
      description: 'Outstanding payments and collection rates',
      icon: <FileText className="h-6 w-6 text-red-500" />,
      data: { outstanding: '$500', collected: '$200', overdue: '$100' }
    },
    {
      title: 'Commission Report',
      description: 'Commission breakdown by product/farmer',
      icon: <DollarSign className="h-6 w-6 text-indigo-500" />,
      data: reportData.financial ? {
        totalCommission: `$${reportData.financial.commission}`,
        rate: '5%',
        transactions: reportData.sales?.transactions || 0
      } : { totalCommission: '$0', rate: '5%', transactions: 0 }
    }
  ]

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and analysis</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {report.icon}
                <h3 className="text-lg font-semibold">{report.title}</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Download className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{report.description}</p>
            
            <div className="space-y-2">
              {Object.entries(report.data).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Top Performing Products</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Sample Product</span>
                <span className="text-sm font-medium">$100 (10 sales)</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Payment Collection Rate</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">On-time payments</span>
                <span className="text-sm font-medium text-green-600">80%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Overdue payments</span>
                <span className="text-sm font-medium text-red-600">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports