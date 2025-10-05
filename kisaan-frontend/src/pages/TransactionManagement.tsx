import { TransactionCardList } from '../components/TransactionCardList';
import { getTransactionStatusColor } from '../utils/transactionStatusColors';
import React, { useState, useEffect } from 'react';
import { formatDisplayDate, getToday, formatDate } from '../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { TransactionFilters } from '../components/TransactionFilters';
import { TransactionTable } from '../components/TransactionTable';
import { transactionsApi } from '../services/api';
import { exportTransactionsPDF } from '../utils/pdf/transactionReport';
import type { User } from '../types/api';
import { getUserDisplayNameById } from '../utils/userDisplayName';
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
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const todayStr = getToday();
  const [filters, setFilters] = useState({ search: '', from_date: todayStr, to_date: todayStr });

  // PDF Export using utility
  const handleExportPDF = () => {
    const enriched = filteredTransactions.map(txn => {
  const buyer = getUserDisplayNameById(users, txn.buyer_id);
  const farmer = getUserDisplayNameById(users, txn.farmer_id);
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
    paginatedTransactions.forEach((transaction: Transaction, idx: number) => {
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
          const params: { shop_id: number; limit: number; from_date: string; to_date: string } = {
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
  const matchesUser = (t: Transaction, selectedUser: string, users: User[]) => {
  if (!selectedUser || selectedUser === 'all') return true;
  const selectedUserObj = users.find(u => String(u.id) === selectedUser);
  if (!selectedUserObj) return true;
  // Only match by user id, do not allow role-based matching
  return String(t.farmer_id) === String(selectedUserObj.id) || String(t.buyer_id) === String(selectedUserObj.id);
    };

  const matchesSearch = (t: Transaction, searchLower: string, users: User[]) => {
      if (!searchLower) return true;
      if (t.product_name?.toLowerCase().includes(searchLower)) return true;
      if (String(t.buyer_id).includes(searchLower) || String(t.farmer_id).includes(searchLower)) return true;
      const buyerUser = users.find(u => String(u.id) === String(t.buyer_id));
      const farmerUser = users?.find?.(u => String(u.id) === String(t.farmer_id));
      if (buyerUser?.firstname?.trim() && buyerUser.firstname.toLowerCase().includes(searchLower)) return true;
      if (farmerUser?.firstname?.trim() && farmerUser.firstname.toLowerCase().includes(searchLower)) return true;
      return false;
    };

  const filteredTransactions = allTxns.filter(t =>
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

  // Use global getTransactionStatusColor util

  useEffect(() => {
    const newState: {[key: string]: boolean} = {};
    paginatedTransactions.forEach((transaction: Transaction, idx: number) => {
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
      <TransactionFilters
        filters={filters}
        setFilters={setFilters}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        users={users}
      />

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
                <TransactionTable
                  paginatedTransactions={paginatedTransactions}
                  openRows={openRows}
                  toggleRow={toggleRow}
                  users={users}
                  getTransactionStatus={getTransactionStatus}
                  getTransactionStatusColor={getTransactionStatusColor}
                />
              </div>
              {/* Mobile Card/List Layout */}
              <div className="block sm:hidden space-y-3 w-full">
                <TransactionCardList
                  paginatedTransactions={paginatedTransactions}
                  users={users}
                  getTransactionStatus={getTransactionStatus}
                  getTransactionStatusColor={getTransactionStatusColor}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card> 
    </div>
  );
};

export default TransactionManagement;