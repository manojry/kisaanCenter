import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, Filter, RefreshCw, AlertCircle } from 'lucide-react';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount || isNaN(Number(amount))) return '₹0.00';
    return `₹${Number(amount).toFixed(2)}`;
  };

  const handleRefresh = () => {
    fetchTransactions();
    if (onRefresh) onRefresh();
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
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <Input
              placeholder="Search farmer/buyer/product..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div>
            <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="farmer_due">Farmer Due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Input
              type="date"
              placeholder="From date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            />
          </div>

          <div>
            <Input
              type="date"
              placeholder="To date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            />
          </div>
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
                  <TableHead>Buyer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Farmer Paid</TableHead>
                  <TableHead>Buyer Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                    <TableCell className="font-medium">{transaction.farmer_name}</TableCell>
                    <TableCell className="font-medium">{transaction.buyer_name}</TableCell>
                    <TableCell className="font-medium">{transaction.product_name}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>{formatCurrency(transaction.price)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(transaction.total)}</TableCell>
                    <TableCell>{formatCurrency(transaction.commission_amount)}</TableCell>
                    <TableCell>{formatCurrency(transaction.farmer_paid)}</TableCell>
                    <TableCell>{formatCurrency(transaction.buyer_paid)}</TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {formatCurrency(transaction.deficit)}
                    </TableCell>
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