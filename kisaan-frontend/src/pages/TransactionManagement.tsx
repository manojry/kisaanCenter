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
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    from_date: '',
    to_date: ''
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
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
              transactions.map(transaction => (
                <div key={transaction.id} className="flex flex-col md:flex-row justify-between items-stretch md:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-lg">{transaction.product_name}</p>
                      <Badge className={getStatusColor(transaction.status || 'completed')}>
                        {transaction.status || 'completed'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">Quantity</p>
                        <p>{transaction.quantity} units</p>
                      </div>
                      <div>
                        <p className="font-medium">Unit Price</p>
                        <p>{formatCurrency(transaction.unit_price)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Commission</p>
                        <p className="text-green-600">{formatCurrency(transaction.shop_commission)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Date</p>
                        <p>{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>
                    {/* Payment details */}
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-700 mb-1">Payments:</p>
                      {transaction.payments && transaction.payments.length > 0 ? (
                        <div className="space-y-1">
                          {transaction.payments.map((payment, idx) => (
                            <div key={payment.id || idx} className="flex flex-wrap gap-4 text-xs text-gray-700 border border-gray-100 rounded px-2 py-1 bg-gray-50">
                              <span><b>Amount:</b> {formatCurrency(payment.amount)}</span>
                              <span><b>Status:</b> {payment.status}</span>
                              <span><b>Method:</b> {payment.method}</span>
                              {payment.payment_date && <span><b>Date:</b> {formatDate(payment.payment_date)}</span>}
                              <span><b>Payer:</b> {payment.payer_type}</span>
                              <span><b>Payee:</b> {payment.payee_type}</span>
                              {payment.notes && <span><b>Notes:</b> {payment.notes}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No payments recorded</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4 mt-4 md:mt-0">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(transaction.total_sale_value)}
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionManagement;