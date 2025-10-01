import React, { useState, useEffect } from 'react';
import { formatDisplayDate, getToday, formatDate } from '../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { transactionsApi } from '../services/api';
import { exportTransactionsPDF } from '../utils/pdf/transactionReport';
// Helper to get user name by id
type User = { id: string | number; firstname?: string; username?: string };
const getUserName = (users: User[], id: string | number): string => {
  const user = users.find((u: User) => String(u.id) === String(id));
  return user?.firstname?.trim() ? user.firstname! : user?.username ?? '';
};
import type { Transaction } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { TransactionForm } from '../components/owner/TransactionForm';
import { useTransactionStore } from '../store/transactionStore';

const TransactionManagement: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const todayStr = getToday();
  const [filters, setFilters] = useState({ search: '', from_date: todayStr, to_date: todayStr });

  // PDF Export using utility
  const handleExportPDF = () => {
    const enriched = filteredTransactions.map(txn => {
      const buyer = getUserName(users, txn.buyer_id);
      const farmer = getUserName(users, txn.farmer_id);
      return {
        id: txn.id,
        transaction_id: txn.id,
        created_at: formatDisplayDate(txn.created_at),
        product_name: txn.product_name,
        buyer_name: buyer,
        farmer_name: farmer,
  total_sale_value: txn.total_amount,
        buyer_paid: txn.buyer_paid,
        deficit: txn.deficit,
        farmer_paid: txn.farmer_paid,
        farmer_due: txn.farmer_due,
        payments: (txn.payments || []).map(p => {
          const payer = String(p.payer_type) === 'BUYER' ? buyer : String(p.payer_type) === 'FARMER' ? farmer : String(p.payer_type) === 'SHOP' ? 'Shop' : String(p.payer_type);
          const payee = String(p.payee_type) === 'BUYER' ? buyer : String(p.payee_type) === 'FARMER' ? farmer : String(p.payee_type) === 'SHOP' ? 'Shop' : String(p.payee_type);
          return {
            payer,
            payee,
            amount: p.amount,
            method: p.method,
            payment_date: p.payment_date ? formatDisplayDate(p.payment_date) : undefined,
          };
        })
      };
    });
    exportTransactionsPDF(enriched, {
      title: 'Transactions Report',
      generatedBy: user?.username,
      dateRange: { from: filters.from_date, to: filters.to_date }
    });
  };
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Row expansion state
  const [openRows, setOpenRows] = useState<{[key: string]: boolean}>({});
  const toggleRow = (rowKey: string) => setOpenRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  const collapseAll = () => {
    const newState: {[key: string]: boolean} = {};
    paginatedTransactions.forEach((transaction: any, idx: number) => {
      newState[transaction.id + '-' + idx] = false;
    });
    setOpenRows(newState);
  };
  const expandAll = () => {
    const newState: {[key: string]: boolean} = {};
    paginatedTransactions.forEach((transaction: any, idx: number) => {
      newState[transaction.id + '-' + idx] = true;
    });
    setOpenRows(newState);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [filteredTransactions, totalPages]);
  const transactionStore = useTransactionStore();

  // Reset open rows when data / pagination changes
  useEffect(() => {
    const newState: {[key: string]: boolean} = {};
    paginatedTransactions.forEach((transaction: any, idx: number) => {
      newState[transaction.id + '-' + idx] = false;
    });
    setOpenRows(newState);
  }, [filters, selectedUser, currentPage, filteredTransactions.length]);
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
      setCurrentPage(1);
    }, 100);
    return () => clearTimeout(handler);
  }, [user?.shop_id, filters, selectedUser]);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, user?.shop_id, filters, selectedUser]);

  const fetchTransactions = async (invalidateDates?: string[]) => {
    if (!user?.shop_id) return;
    setIsLoading(true);
    const { from_date, to_date, search } = filters;
    // Always use UTC date strings for API calls
    const start = new Date(from_date);
    const end = new Date(to_date);
    const dateList: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateList.push(formatDate(d)); // formatDate always returns UTC YYYY-MM-DD
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
            from_date: formatDate(date),
            to_date: formatDate(date)
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
    // Combine user and search filters in one pass
    const searchLower = search ? search.toLowerCase() : '';
    const matchesUser = (t: Transaction, selectedUser: string, users: any[]) => {
  if (!selectedUser || selectedUser === 'all') return true;
  const selectedUserObj = users.find(u => String(u.id) === selectedUser);
  if (!selectedUserObj) return true;
  // Only match by user id, do not allow role-based matching
  return String(t.farmer_id) === String(selectedUserObj.id) || String(t.buyer_id) === String(selectedUserObj.id);
    };

    const matchesSearch = (t: Transaction, searchLower: string, users: any[]) => {
      if (!searchLower) return true;
      if (t.product_name?.toLowerCase().includes(searchLower)) return true;
      if (String(t.buyer_id).includes(searchLower) || String(t.farmer_id).includes(searchLower)) return true;
      const buyerUser = users.find(u => String(u.id) === String(t.buyer_id));
      const farmerUser = users?.find?.(u => String(u.id) === String(t.farmer_id));
      if (buyerUser?.firstname?.trim() && buyerUser.firstname.toLowerCase().includes(searchLower)) return true;
      if (farmerUser?.firstname?.trim() && farmerUser.firstname.toLowerCase().includes(searchLower)) return true;
      return false;
    };

    let filteredTransactions = allTxns.filter(t =>
      matchesUser(t, selectedUser, users) && matchesSearch(t, searchLower, users)
    );
    setTransactions(allTxns); // Store all fetched transactions
    setFilteredTransactions(filteredTransactions); // Store filtered transactions for display
    setCurrentPage(1); // Reset to first page after filtering
    setIsLoading(false);
  };

  const handleTransactionCreated = () => {
  setShowCreateForm(false);
  // Invalidate cache for the affected date(s) and refetch
  const affectedDate = filters.from_date;
  transactionStore.invalidateTransactions(String(user?.shop_id), [affectedDate]);
  fetchTransactions([affectedDate]);
  // Refetch payments and balances after transaction
  if (user?.shop_id) {
    import('../services/api').then(m => {
      m.paymentsApi.getAll({ payee_type: 'SHOP', page: 1, limit: 50 }).then(() => {});
      m.balanceSnapshotsApi.getByUserId(String(user.shop_id)).then(() => {});
    });
  }
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

  useEffect(() => {
    const newState: {[key: string]: boolean} = {};
    paginatedTransactions.forEach((transaction: any, idx: number) => {
      newState[transaction.id + '-' + idx] = false;
    });
    setOpenRows(newState);
  }, [filters, selectedUser, currentPage, filteredTransactions.length]);

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
  <div className="p-2 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row w-full mb-2 items-start sm:items-center gap-2">
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">Transaction Management</h1>
          <p className="text-gray-600 text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">Manage all shop transactions</p>
        </div>
        <div className="flex flex-row gap-2 items-center ml-auto w-auto">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="px-2 py-1 text-xs sm:text-sm"
            style={{ minWidth: 0 }}
          >
            Export PDF
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)} 
            className="bg-green-600 hover:bg-green-700 px-2 py-1 text-xs sm:text-sm"
            size="sm"
            style={{ minWidth: 0 }}
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">New</span>
            <span className="inline xs:hidden">+</span>
          </Button>
          <Button 
            onClick={() => fetchTransactions()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="px-2 py-1 text-xs sm:text-sm"
            style={{ minWidth: 0 }}
          >
            <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mt-2">
        <CardHeader className="py-2 px-3">
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center w-full sm:w-auto">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  value={filters.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 text-sm w-full sm:w-64"
                />
              </div>
              <div className="ml-2 w-36">
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                >
                  <SelectTrigger className="text-sm w-full">
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
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                placeholder="From date"
                value={filters.from_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
                className="text-sm w-32"
              />
              <span className="text-xs text-gray-500">to</span>
              <Input
                type="date"
                placeholder="To date"
                value={filters.to_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
                className="text-sm w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <span>Transactions ({filteredTransactions.length})</span>
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
          </CardTitle>
        </CardHeader>
  <CardContent className="p-1 sm:p-2">
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
                    <TableRow className="!py-1 !px-2">
                      <TableHead className="!py-1 !px-2">Txn</TableHead>
                      <TableHead colSpan={4} className="!py-1 !px-2"></TableHead>
                      <TableHead className="text-right !py-1 !px-2" style={{ minWidth: 180 }}>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const allOpen = Object.values(openRows).every(Boolean);
                              if (allOpen) collapseAll(); else expandAll();
                            }}
                          >
                            {Object.values(openRows).every(Boolean) ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                            {Object.values(openRows).every(Boolean) ? 'Collapse All' : 'Expand All'}
                          </Button>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction, idx) => {
                      const derivedStatus = getTransactionStatus(transaction);
                      const rowKey = transaction.id + '-' + idx;
                      const open = openRows[rowKey] || false;
                      // Find farmer user for firstname
                      const farmerUser = users.find(u => String(u.id) === String(transaction.farmer_id));
                      let farmerName = farmerUser?.firstname?.trim() ? farmerUser.firstname : farmerUser?.username ?? '';
                      return (
                        <React.Fragment key={rowKey}>
                          <TableRow>
                            <TableCell colSpan={6} style={{ padding: 0 }}>
                              <button
                                type="button"
                                className="flex items-center cursor-pointer py-2 px-1 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                                aria-pressed={open}
                                aria-label={open ? 'Collapse transaction details' : 'Expand transaction details'}
                                tabIndex={0}
                                onClick={() => {
                                  toggleRow(rowKey);
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleRow(rowKey);
                                  }
                                }}
                                onTouchStart={() => {
                                  toggleRow(rowKey);
                                }}
                              >
                                <Badge className={getStatusColor(derivedStatus)} style={{ marginRight: 8 }}>{derivedStatus}</Badge>
                                <span className="font-semibold mr-2">{farmerName}</span>
                                <span className="text-xs text-gray-500 mr-2">{formatDateDisplay(transaction.created_at)}</span>
                                <span className="text-xs text-gray-500 mr-2">Product: {transaction.product_name}</span>
                                <span className="font-medium mr-2">{formatCurrency(transaction.total_amount)}</span>
                   <span className="font-medium mr-2">{formatCurrency(transaction.total_amount)}</span>
                                {open ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                              </button>
                            </TableCell>
                          </TableRow>
                          {open && (
                            <TableRow>
                              <TableCell colSpan={6} style={{ background: '#f9fafb', padding: '12px 16px' }}>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div className="col-span-1">
                                    <div><span className="font-medium">Buyer:</span> {getUserName(users, transaction.buyer_id)}</div>
                                    <div><span className="font-medium">Seller:</span> {getUserName(users, transaction.farmer_id)}</div>
                                  </div>
                                  <div className="col-span-1">
                                    {(() => {
                                      // Map backend payments to summary fields
                                      let buyerPaid = 0, buyerPending = 0, farmerPaid = 0, farmerPending = 0;
                                      if (transaction.payments && transaction.payments.length > 0) {
                                        transaction.payments.forEach(p => {
                                          if (p.payer_type === 'BUYER' && p.payee_type === 'SHOP') buyerPaid += Number(p.amount);
                                          // Removed invalid: if (p.payer_type === 'SHOP' && p.payee_type === 'BUYER')
                                          if (p.payer_type === 'SHOP' && p.payee_type === 'FARMER') farmerPaid += Number(p.amount);
                                        });
                                      }
                                      return (
                                        <>
                                          <div><span className="font-medium">Buyer Paid:</span> {formatCurrency(buyerPaid)}</div>
                                          <div><span className="font-medium">Buyer Pending:</span> {formatCurrency(buyerPending)}</div>
                                          <div><span className="font-medium">Farmer Paid:</span> {formatCurrency(farmerPaid)}</div>
                                          <div><span className="font-medium">Farmer Pending:</span> {formatCurrency(farmerPending)}</div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <div className="col-span-1">
                                    <span className="font-medium">Payments:</span>
                                    {transaction.payments && transaction.payments.length > 0 ? (
                                      <ul className="mt-1 ml-2 list-disc">
                                        {transaction.payments.map((p, i) => {
                                          let payer = String(p.payer_type) === 'BUYER' ? getUserName(users, transaction.buyer_id)
                                            : String(p.payer_type) === 'FARMER' ? getUserName(users, transaction.farmer_id)
                                            : String(p.payer_type) === 'SHOP' ? 'Shop' : String(p.payer_type);
                                          let payee = String(p.payee_type) === 'BUYER' ? getUserName(users, transaction.buyer_id)
                                            : String(p.payee_type) === 'FARMER' ? getUserName(users, transaction.farmer_id)
                                            : String(p.payee_type) === 'SHOP' ? 'Shop' : String(p.payee_type);
                                          let label = `${payer} → ${payee}`;
                                          return (
                                            <li key={i} className="mb-1">
                                              <span className="font-medium">{label}:</span> {formatCurrency(p.amount)}
                                              {' '}<span className="text-gray-500">({p.method}{p.payment_date ? `, ${formatDisplayDate(p.payment_date)}` : ''})</span>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    ) : (
                                      <span className="text-gray-400 text-xs">No payments</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile Card/List Layout */}
              <div className="block sm:hidden space-y-3 w-full">
                 {paginatedTransactions.map((transaction, idx) => {
                  const derivedStatus = getTransactionStatus(transaction);
                  return (
                    <div key={transaction.id + '-' + idx} className="rounded-lg border p-3 bg-white shadow-sm w-full mx-auto break-words">
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <span className="font-semibold text-base break-words max-w-[60%] truncate">{transaction.product_name}</span>
                        <Badge className={getStatusColor(derivedStatus)}>{derivedStatus}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mb-1 break-words">{formatDateDisplay(transaction.created_at)}</div>
                      <div className="flex flex-wrap gap-2 text-xs mb-1">
            <div className="break-words max-w-[48%]"><span className="font-medium">Total:</span> {formatCurrency(transaction.total_amount)}</div>
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