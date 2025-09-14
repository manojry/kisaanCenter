import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Plus,
  Search,
  Eye,
  RefreshCw
} from 'lucide-react';
import { transactionsApi } from '../services/api';
import type { Transaction } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { TransactionForm } from '../components/owner/TransactionForm';

const TransactionManagement: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Set default filters to today for from_date and to_date
  const todayStr = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    from_date: todayStr,
    to_date: todayStr
  });

  useEffect(() => {
    fetchTransactions();
  }, [user?.shop_id, filters]);

  const fetchTransactions = async () => {
    if (!user?.shop_id) return;
    
    setIsLoading(true);
    try {
      const params: any = {
        shop_id: user.shop_id,
        limit: 50
      };
      
      if (filters.status) params.status = filters.status;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      
      const response = await transactionsApi.getAll(params);
      if (response.data) {
        let filteredTransactions = response.data;
        
        // Client-side search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredTransactions = filteredTransactions.filter(t => 
            t.product_name.toLowerCase().includes(searchLower)
          );
        }
        
        setTransactions(filteredTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionCreated = (transaction: Transaction) => {
    setShowCreateForm(false);
    fetchTransactions();
  };

  const formatCurrency = (value: string | number | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return '';
    return `₹${num.toLocaleString()}`;
  };
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleString();
  };


  // Determine transaction status based on payment info
  const getTransactionStatus = (transaction: Transaction) => {
    if (transaction.deficit && Number(transaction.deficit) > 0) {
      return 'Buyer Due';
    } else if (transaction.farmer_due && Number(transaction.farmer_due) > 0) {
      return 'Farmer Due';
    } else {
      return 'Completed';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Buyer Due': return 'bg-red-100 text-red-800';
      case 'Farmer Due': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showCreateForm) {
    return (
      <div className="p-6">
        <TransactionForm 
          onSuccess={handleTransactionCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600">Manage all shop transactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchTransactions}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)} 
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select 
              value={filters.status || "all"} 
              onValueChange={(value: string) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From date"
              value={filters.from_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
            />
            <Input
              type="date"
              placeholder="To date"
              value={filters.to_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions ({transactions.length})</span>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No transactions found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {filters.search || filters.status || filters.from_date || filters.to_date
                    ? 'Try adjusting your filters'
                    : 'Create your first transaction to get started'
                  }
                </p>
              </div>
            ) : (
              transactions.map(transaction => {
                const derivedStatus = getTransactionStatus(transaction);
                return (
                  <div key={transaction.id} className="flex flex-col md:flex-row justify-between items-stretch md:items-center p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-base">{transaction.product_name}</p>
                        <Badge className={getStatusColor(derivedStatus)}>{derivedStatus}</Badge>
                        <span className="ml-2 text-xs text-gray-500">{formatDate(transaction.created_at)}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mb-1">
                        <div><b>Qty:</b> {transaction.quantity} units</div>
                        <div><b>Unit:</b> {formatCurrency(transaction.unit_price)}</div>
                        <div><b>Comm:</b> <span className="text-green-600">{formatCurrency(transaction.shop_commission)}</span></div>
                        <div><b>Total:</b> {formatCurrency(transaction.total_sale_value)}</div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 items-center">
                        <span><b>Buyer:</b> Paid {formatCurrency(transaction.buyer_paid)} / Pending {formatCurrency(transaction.deficit)}</span>
                        <span><b>Farmer:</b> Paid {formatCurrency(transaction.farmer_paid)} / Pending {formatCurrency(transaction.farmer_due)}</span>
                        {transaction.payments && transaction.payments.length > 0 ? (
                          <span className="flex flex-wrap gap-2">
                            {transaction.payments.map((payment, idx) => {
                              let label = '';
                              if (payment.payer_type === 'BUYER' && payment.payee_type === 'SHOP') {
                                label = 'Paid by Buyer';
                              } else if (payment.payer_type === 'SHOP' && payment.payee_type === 'FARMER') {
                                label = 'Paid to Farmer';
                              } else if (payment.payer_type === 'SHOP' && payment.payee_type === 'SHOP') {
                                label = 'Commission';
                              } else {
                                label = `Paid by ${payment.payer_type} to ${payment.payee_type}`;
                              }
                              return (
                                <span key={payment.id || idx} className="border border-gray-100 rounded px-1 py-0.5 bg-gray-100">
                                  {label}: {formatCurrency(payment.amount)} ({payment.method}{payment.payment_date ? `, ${new Date(payment.payment_date).toLocaleDateString()}` : ''})
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">No payments</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-2 mt-2 md:mt-0 flex flex-col items-end justify-between min-w-[100px]">
                      <span className="text-base font-bold text-gray-900">{formatCurrency(transaction.total_sale_value)}</span>
                      <Button size="sm" variant="outline" className="mt-1">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionManagement;