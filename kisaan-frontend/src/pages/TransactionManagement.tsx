import React, { useState, useEffect } from 'react';
import { formatDisplayDate, getToday } from '../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Plus,
  Search,
  RefreshCw
} from 'lucide-react';
import { transactionsApi } from '../services/api';
import type { Transaction } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { TransactionForm } from '../components/owner/TransactionForm';
import { useTransactionStore } from '../store/transactionStore';

const TransactionManagement: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const paginatedTransactions = transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Clamp currentPage to valid range whenever transactions change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [transactions, totalPages]);
  const transactionStore = useTransactionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  // Set default filters to today for from_date and to_date
  const todayStr = getToday();
  const [filters, setFilters] = useState({
    search: '',
    from_date: todayStr,
    to_date: todayStr
  });
  useEffect(() => {
    fetchUsers();
  }, [user?.shop_id]);

  const fetchUsers = async () => {
    if (!user?.shop_id) return;
    try {
      const response = await import('../services/api').then(m => m.usersApi.getAll({ shop_id: user.shop_id, limit: 100 }));
      setUsers(response.data || []);
    } catch (error) {
      setUsers([]);
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    // Debounced filter change logic
    const handler = setTimeout(() => {
      fetchTransactions();
      setCurrentPage(1); // Reset to first page on filter change
    }, 300);
    return () => clearTimeout(handler);
  }, [user?.shop_id, filters, selectedUser]);

  const fetchTransactions = async (invalidateDates?: string[]) => {
    if (!user?.shop_id) return;
    setIsLoading(true);
    const { from_date, to_date, search } = filters;
    // Get all dates in range
    const start = new Date(from_date);
    const end = new Date(to_date);
    const dateList: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateList.push(d.toISOString().split('T')[0]);
    }
    const shopIdStr = String(user.shop_id);
    // Invalidate cache for affected dates if requested
    if (invalidateDates && invalidateDates.length > 0) {
      transactionStore.invalidateTransactions(shopIdStr, invalidateDates);
    }
    // Check which dates are missing in cache
    const cachedTxns = transactionStore.getTransactions(shopIdStr, dateList);
    const missingDates = dateList.filter(date => {
      const shopData = transactionStore.transactionsByShopAndDate[shopIdStr] || {};
      return !shopData[date];
    });
    let allTxns: Transaction[] = [...cachedTxns];
    // If any dates missing, fetch and cache them
    if (missingDates.length > 0) {
      for (const date of missingDates) {
        try {
          const params: any = {
            shop_id: user.shop_id,
            limit: 50,
            from_date: date,
            to_date: date
          };
          const response = await transactionsApi.getAll(params);
          if (response.data) {
            transactionStore.setTransactions(shopIdStr, date, response.data);
            allTxns = allTxns.concat(response.data);
          }
        } catch (error) {
          console.error('Error fetching transactions for date', date, error);
        }
      }
    }
    // Now filter client-side for user and search
    let filteredTransactions = [...allTxns];
    if (selectedUser && selectedUser !== 'all') {
      const selectedUserObj = users.find(u => String(u.id) === selectedUser);
      if (selectedUserObj) {
        filteredTransactions = filteredTransactions.filter(t => {
          if (selectedUserObj.role === 'farmer') return t.farmer_id === selectedUserObj.id;
          if (selectedUserObj.role === 'buyer') return t.buyer_id === selectedUserObj.id;
          return t.id === selectedUserObj.id;
        });
      }
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTransactions = filteredTransactions.filter(t => t.product_name.toLowerCase().includes(searchLower));
    }
    setTransactions(filteredTransactions);
    setIsLoading(false);
  };

  const handleTransactionCreated = () => {
  setShowCreateForm(false);
  // Invalidate cache for the affected date(s) and refetch
  const affectedDate = filters.from_date;
  fetchTransactions([affectedDate]);
  };

  const formatCurrency = (value: string | number | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return '';
    return `₹${num.toLocaleString()}`;
  };
  // Use formatDisplayDate from dateUtils for display
  const formatDateDisplay = (dateString: string | undefined) => {
    if (!dateString) return '';
    return formatDisplayDate(dateString);
  }


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
  <div className="p-2 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage all shop transactions</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => fetchTransactions()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)} 
            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 text-sm"
                />
              </div>
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.firstname ? u.firstname : u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <Input
                type="date"
                placeholder="From date"
                value={filters.from_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
                className="text-sm"
              />
              <Input
                type="date"
                placeholder="To date"
                value={filters.to_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <span>Transactions ({transactions.length})</span>
            {totalPages > 1 && (
              <div className="flex gap-2 items-center ml-4">
                <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                  Prev
                </Button>
                <span className="text-xs">Page {currentPage} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            )}
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500 text-base sm:text-lg">No transactions found</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                {filters.search || filters.from_date || filters.to_date
                  ? 'Try adjusting your filters'
                  : 'Create your first transaction to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table className="min-w-[700px] text-xs sm:text-sm">
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
                    {paginatedTransactions.map(transaction => {
                      const derivedStatus = getTransactionStatus(transaction);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.product_name}</TableCell>
                          <TableCell>{formatDateDisplay(transaction.created_at)}</TableCell>
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
                                        }).join('\n')}>
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
              </div>
              {/* Mobile Card/List Layout */}
              <div className="block sm:hidden space-y-3">
                {paginatedTransactions.map(transaction => {
                  const derivedStatus = getTransactionStatus(transaction);
                  return (
                    <div key={transaction.id} className="rounded-lg border p-3 bg-white shadow-sm w-[90vw] max-w-[90vw] overflow-x-auto mx-auto">
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <span className="font-semibold text-base break-words max-w-[60%]">{transaction.product_name}</span>
                        <Badge className={getStatusColor(derivedStatus)}>{derivedStatus}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mb-1 break-words">{formatDateDisplay(transaction.created_at)}</div>
                      <div className="flex flex-wrap gap-2 text-xs mb-1">
                        <div className="break-words max-w-[48%]"><span className="font-medium">Total:</span> {formatCurrency(transaction.total_sale_value)}</div>
                        <div className="break-words max-w-[48%]"><span className="font-medium">Buyer Paid:</span> {formatCurrency(transaction.buyer_paid)}</div>
                        <div className="break-words max-w-[48%]"><span className="font-medium">Buyer Pending:</span> {formatCurrency(transaction.deficit)}</div>
                        <div className="break-words max-w-[48%]"><span className="font-medium">Farmer Paid:</span> {formatCurrency(transaction.farmer_paid)}</div>
                        <div className="break-words max-w-[48%]"><span className="font-medium">Farmer Pending:</span> {formatCurrency(transaction.farmer_due)}</div>
                      </div>
                      <div className="text-xs break-words">
                        <span className="font-medium">Payments:</span> {transaction.payments && transaction.payments.length > 0 ? (
                          <span>
                            {(() => {
                              const first = transaction.payments[0];
                              let label = '';
                              if (first.payer_type === 'BUYER' && first.payee_type === 'SHOP') label = 'Paid by Buyer';
                              else if (first.payer_type === 'SHOP' && first.payee_type === 'FARMER') label = 'Paid to Farmer';
                              else if (first.payer_type === 'SHOP' && first.payee_type === 'SHOP') label = 'Commission';
                              else label = `Paid by ${first.payer_type} to ${first.payee_type}`;
                              return (
                                <>
                                      {label}: {formatCurrency(first.amount)} ({first.method}{first.payment_date ? `, ${formatDisplayDate(first.payment_date)}` : ''})
                                  {transaction.payments.length > 1 && (
                                    <span title={transaction.payments.slice(1).map(p => {
                                      let l = '';
                                      if (p.payer_type === 'BUYER' && p.payee_type === 'SHOP') l = 'Paid by Buyer';
                                      else if (p.payer_type === 'SHOP' && p.payee_type === 'FARMER') l = 'Paid to Farmer';
                                      else if (p.payer_type === 'SHOP' && p.payee_type === 'SHOP') l = 'Commission';
                                      else l = `Paid by ${p.payer_type} to ${p.payee_type}`;
                                          return `${l}: ${formatCurrency(p.amount)} (${p.method}${p.payment_date ? `, ${formatDisplayDate(p.payment_date)}` : ''})`;
                                    }).join('\n')}>
                                      {" "}+{transaction.payments.length - 1} more
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </span>
                        ) : (
                          <span className="text-gray-400">No payments</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card> 
    </div>
  );
};

export default TransactionManagement;