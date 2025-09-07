import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, Filter, RefreshCw, AlertCircle, FileText, Download, Package } from 'lucide-react';
import { reportService } from '../services/reportService';
import { formatCurrency, formatNumber, formatQuantity, formatDate } from '../lib/formatters';

interface Transaction {
  id: number;
  farmer_id: string;
  farmer_name: string;
  buyer_id: string;
  buyer_name: string;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  commission_amount: number;
  farmer_paid: number;
  buyer_paid: number;
  deficit: number;
  status: string;
  transaction_date: string;
}

interface TransactionsListProps {
  shopId?: number;
  onRefresh?: () => void;
}

export default function TransactionsList({ shopId, onRefresh }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    search: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [shopId]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    if (!shopId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/transactions?shop_id=${shopId}&include_analytics=true`);
      const transactionsData = response?.data || [];
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Date range filter
    if (filters.date_from) {
      filtered = filtered.filter(t => new Date(t.transaction_date) >= new Date(filters.date_from));
    }
    if (filters.date_to) {
      filtered = filtered.filter(t => new Date(t.transaction_date) <= new Date(filters.date_to));
    }

    // Search filter (farmer_name, buyer_name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        (t.farmer_name && t.farmer_name.toLowerCase().includes(searchLower)) ||
        (t.buyer_name && t.buyer_name.toLowerCase().includes(searchLower)) ||
        (t.product_name && t.product_name.toLowerCase().includes(searchLower))
      );
    }

    setFilteredTransactions(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      partial: "secondary",
      credit: "destructive",
      farmer_due: "outline"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };



  const handleRefresh = () => {
    fetchTransactions();
    if (onRefresh) onRefresh();
  };

  const handleQuickExport = () => {
    if (!shopId) return;
    
    // Use fallback report generation directly since backend API is not available
    generateFallbackReport();
  };

  const generateFallbackReport = () => {
    const reportData = {
      shopId,
      transactions: filteredTransactions,
      dateRange: filters.date_from && filters.date_to ? `${filters.date_from} to ${filters.date_to}` : 'All Time',
      totalSales: filteredTransactions.reduce((sum, t) => sum + t.total, 0),
      totalTransactions: filteredTransactions.length
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Shop Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .summary { background: #f9f9f9; padding: 15px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌾 KisaanCenter - Shop Report</h1>
        <p>Period: ${reportData.dateRange}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Transactions:</strong> ${reportData.totalTransactions}</p>
        <p><strong>Total Sales:</strong> ${formatCurrency(reportData.totalSales)}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Farmer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.transactions.map(t => `
            <tr>
                <td>${formatDate(t.transaction_date)}</td>
                <td>${t.farmer_name}</td>
                <td>${t.product_name}</td>
                <td>${formatQuantity(t.quantity)}</td>
                <td>${formatCurrency(t.total)}</td>
                <td>${t.status.toUpperCase()}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shop-report-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading transactions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} of {transactions.length} transactions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleQuickExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4 items-center">
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-32 sm:w-48"
          />
          <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
            <SelectTrigger className="w-10 px-2">
              <Filter className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="farmer_due">Farmer Due</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            className="w-24"
            title="From date"
          />
          <Input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            className="w-24"
            title="To date"
          />
        </div>
      </CardHeader>

      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead className="hidden xs:table-cell">Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Qty</TableHead>
                  <TableHead className="hidden md:table-cell">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                    <TableCell className="font-medium truncate max-w-[80px]">{transaction.farmer_name}</TableCell>
                    <TableCell className="font-medium hidden xs:table-cell truncate max-w-[80px]">{transaction.product_name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {formatQuantity(transaction.quantity)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-semibold">{formatCurrency(transaction.total)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}