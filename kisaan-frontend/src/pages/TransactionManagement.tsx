import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions ({transactions.length})</span>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No transactions found</p>
              <p className="text-gray-400 text-sm mt-2">
                {filters.search || filters.status || filters.from_date || filters.to_date
                  ? 'Try adjusting your filters'
                  : 'Create your first transaction to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Buyer Paid/Pending</TableHead>
                  <TableHead>Farmer Paid/Pending</TableHead>
                  <TableHead>Payments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => {
                  const derivedStatus = getTransactionStatus(transaction);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.product_name}</TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(derivedStatus)}>{derivedStatus}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(transaction.total_sale_value)}</TableCell>
                      <TableCell>
                        Paid {formatCurrency(transaction.buyer_paid)}<br />
                        <span className="text-xs text-gray-500">Pending {formatCurrency(transaction.deficit)}</span>
                      </TableCell>
                      <TableCell>
                        Paid {formatCurrency(transaction.farmer_paid)}<br />
                        <span className="text-xs text-gray-500">Pending {formatCurrency(transaction.farmer_due)}</span>
                      </TableCell>
                      <TableCell>
                        {transaction.payments && transaction.payments.length > 0 ? (
                          <div className="truncate text-xs">
                            {(() => {
                              const first = transaction.payments[0];
                              let label = '';
                              if (first.payer_type === 'BUYER' && first.payee_type === 'SHOP') label = 'Paid by Buyer';
                              else if (first.payer_type === 'SHOP' && first.payee_type === 'FARMER') label = 'Paid to Farmer';
                              else if (first.payer_type === 'SHOP' && first.payee_type === 'SHOP') label = 'Commission';
                              else label = `Paid by ${first.payer_type} to ${first.payee_type}`;
                              return (
                                <>
                                  {label}: {formatCurrency(first.amount)} ({first.method}{first.payment_date ? `, ${new Date(first.payment_date).toLocaleDateString()}` : ''})
                                  {transaction.payments.length > 1 && (
                                    <span title={transaction.payments.slice(1).map(p => {
                                      let l = '';
                                      if (p.payer_type === 'BUYER' && p.payee_type === 'SHOP') l = 'Paid by Buyer';
                                      else if (p.payer_type === 'SHOP' && p.payee_type === 'FARMER') l = 'Paid to Farmer';
                                      else if (p.payer_type === 'SHOP' && p.payee_type === 'SHOP') l = 'Commission';
                                      else l = `Paid by ${p.payer_type} to ${p.payee_type}`;
                                      return `${l}: ${formatCurrency(p.amount)} (${p.method}${p.payment_date ? `, ${new Date(p.payment_date).toLocaleDateString()}` : ''})`;
                                    }).join('\\n')}>
                                      {" "}+{transaction.payments.length - 1} more
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No payments</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card> 
    </div>
  );
};

export default TransactionManagement;