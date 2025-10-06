import React, { useState, useEffect, useMemo } from 'react';
import { formatDisplayDate, getToday } from '../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { exportTransactionsPDF } from '../utils/pdf/transactionReport';
import type { Transaction as BaseTransaction, User, Payment } from '../types/api';

// Extend Transaction type with optional frontend-enriched fields
type Transaction = BaseTransaction & {
  buyer_name?: string;
  farmer_name?: string;
  total_sale_value?: number;
  rate?: number;
};
import { useAuth } from '../context/AuthContext';
import { TransactionForm } from '../components/owner/TransactionForm';

// NEW: Import centralized data hooks
import { useShopTransactions, useShopUsers } from '../hooks/useShopData';

// Helper to get user name by id (kept for compatibility)


const TransactionManagement = (): React.ReactElement => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>('all');
  const todayStr = getToday();
  const [filters, setFilters] = useState({ search: '', from_date: todayStr, to_date: todayStr });

  // NEW: Use centralized data hooks instead of manual API calls
  const { 
    data: transactions = [], 
    isLoading, 
    error,
    refetch: refetchTransactions 
  } = useShopTransactions(user?.shop_id, filters);

  const { 
    data: users = [],
    isLoading: usersLoading 
  } = useShopUsers(user?.shop_id);

  // const createTransactionMutation = useCreateTransaction(user?.shop_id); // Remove unused

  // Apply client-side filtering
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by selected user
      if (selectedUser && selectedUser !== 'all') {
      filtered = filtered.filter((txn: Transaction) => 
        String(txn.buyer_id) === selectedUser || String(txn.farmer_id) === selectedUser
      );
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((txn: Transaction & { buyer_name?: string; farmer_name?: string }) => 
        txn.product_name?.toLowerCase().includes(searchLower) ||
        txn.buyer_name?.toLowerCase().includes(searchLower) ||
        txn.farmer_name?.toLowerCase().includes(searchLower) ||
        String(txn.id).includes(searchLower)
      );
    }

    return filtered;
  }, [transactions, selectedUser, filters.search]);

  // Pagination logic
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Row expansion state
  const [openRows, setOpenRows] = useState<{[key: string]: boolean}>({});
  const toggleRow = (rowKey: string) => setOpenRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  
  const collapseAll = () => {
    // Reset openRows state when data changes
    setOpenRows({});
  };
  
  const expandAll = () => {
    const newState: {[key: string]: boolean} = {};
    paginatedTransactions.forEach((transaction: Transaction, idx: number) => {
      newState[transaction.id + '-' + idx] = true;
    });
    setOpenRows(newState);
  };

  // Reset pagination when filters change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [filteredTransactions.length, totalPages, currentPage]);

  // Reset open rows when data changes
  // (Removed empty useEffect that was causing a type error)

  // PDF Export using utility (transactions already come enriched with user names)
  const handleExportPDF = () => {
  const enriched = filteredTransactions.map((txn: Transaction & { buyer_name?: string; farmer_name?: string; total_sale_value?: number; buyer_paid?: number; deficit?: number; farmer_paid?: number; farmer_due?: number; }) => ({
      id: txn.id,
      transaction_id: txn.id,
      created_at: formatDisplayDate(txn.created_at),
      product_name: txn.product_name,
      buyer_name: txn.buyer_name || 'Unknown',
      farmer_name: txn.farmer_name || 'Unknown',
      total_sale_value: txn.total_sale_value,
      buyer_paid: txn.buyer_paid,
      deficit: txn.deficit,
      farmer_paid: txn.farmer_paid,
      farmer_due: txn.farmer_due,
  payments: (txn.payments || []).map((p: Payment) => {
        const payer = String(p.payer_type) === 'BUYER' ? txn.buyer_name : 
                     String(p.payer_type) === 'FARMER' ? txn.farmer_name : 
                     String(p.payer_type) === 'SHOP' ? 'Shop' : String(p.payer_type);
        const payee = String(p.payee_type) === 'BUYER' ? txn.buyer_name : 
                     String(p.payee_type) === 'FARMER' ? txn.farmer_name : 
                     String(p.payee_type) === 'SHOP' ? 'Shop' : String(p.payee_type);
        return {
          payer,
          payee,
          amount: p.amount,
          method: p.method,
          payment_date: p.payment_date ? formatDisplayDate(p.payment_date) : undefined,
        };
      })
    }));
    
    exportTransactionsPDF(enriched, {
      title: 'Transactions Report',
      generatedBy: user?.username,
      dateRange: { from: filters.from_date, to: filters.to_date }
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Transactions</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <Button 
            onClick={() => refetchTransactions()} 
            variant="outline" 
            size="sm" 
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transaction Management</h1>
        <Button onClick={() => setShowCreateForm(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          New Transaction
        </Button>
      </div>

      {/* Create Transaction Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Transaction</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </Button>
            </div>
            <TransactionForm 
              // onClose removed to match TransactionFormProps
              // onTransactionCreated removed to match TransactionFormProps
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <Input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <Input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Filter by User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((user: User) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.firstname || user.username} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={handleExportPDF} variant="outline">
                Export PDF
              </Button>
              <Button 
                onClick={() => refetchTransactions()} 
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {isLoading ? (
            'Loading transactions...'
          ) : (
            <>
              Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
              {users.length > 0 && !usersLoading && (
                <span className="ml-2 text-xs text-gray-500">
                  • {users.length} users loaded
                </span>
              )}
            </>
          )}
        </p>
        
        {paginatedTransactions.length > 0 && (
          <div className="flex gap-2">
            {Object.values(openRows).some(Boolean) ? (
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse All
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={expandAll}>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <span>Transactions ({filteredTransactions.length})</span>
            {totalPages > 1 && (
              <div className="flex gap-2 items-center ml-4">
                <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                  Prev
                </Button>
                <span className="text-xs">Page {currentPage} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
                  Next
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Sale Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {isLoading ? 'Loading transactions...' : 'No transactions found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction: Transaction, idx: number) => {
                    const rowKey = transaction.id + '-' + idx;
                    const isExpanded = openRows[rowKey] || false;
                    
                    return (
                      <React.Fragment key={rowKey}>
                        <TableRow className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(rowKey)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {transaction.id}
                          </TableCell>
                          <TableCell>
                            {formatDisplayDate(transaction.created_at)}
                          </TableCell>
                          <TableCell>{
                            transaction.product_name && transaction.product_name !== 'undefined'
                              ? transaction.product_name
                              : (transaction.product_id || 'Unknown')
                          }</TableCell>
                          <TableCell>{
                            (() => {
                              const buyerUser = users.find((u: User) => String(u.id) === String(transaction.buyer_id));
                              if (buyerUser) {
                                return buyerUser.firstname || buyerUser.username || transaction.buyer_id || 'Unknown';
                              }
                              return transaction.buyer_id || 'Unknown';
                            })()
                          }</TableCell>
                          <TableCell>{
                            (() => {
                              const farmerUser = users.find((u: User) => String(u.id) === String(transaction.farmer_id));
                              if (farmerUser) {
                                return farmerUser.firstname || farmerUser.username || transaction.farmer_id || 'Unknown';
                              }
                              return transaction.farmer_id || 'Unknown';
                            })()
                          }</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(transaction.total_sale_value ?? transaction.total_amount ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.payments?.length > 0 ? 'Paid' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded row details */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-gray-50 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Transaction Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Product:</strong> {transaction.product_name}</p>
                                    <p><strong>Quantity:</strong> {transaction.quantity} kg</p>
                                    <p><strong>Unit Price:</strong> ₹{transaction.unit_price}</p>
                                    <p><strong>Sale Value:</strong> ₹{transaction.total_sale_value ?? transaction.total_amount}</p>
                                    <p><strong>Farmer Earning:</strong> ₹{transaction.farmer_earning}</p>
                                    <p><strong>Commission:</strong> ₹{transaction.commission_amount} ({transaction.commission_rate}%)</p>
                                    <p><strong>Status:</strong> {transaction.status}</p>
                                    <p><strong>Buyer Paid:</strong> ₹{transaction.buyer_paid ?? (transaction.payments?.filter(p => p.payer_type === 'BUYER').reduce((sum, p) => sum + (p.amount || 0), 0) || 0)}</p>
                                    <p><strong>Farmer Paid:</strong> ₹{transaction.farmer_paid ?? (transaction.payments?.filter(p => p.payee_type === 'FARMER').reduce((sum, p) => sum + (p.amount || 0), 0) || 0)}</p>
                                    <p><strong>Farmer Due:</strong> ₹{transaction.farmer_due ?? ((transaction.farmer_earning || 0) - (transaction.farmer_paid ?? (transaction.payments?.filter(p => p.payee_type === 'FARMER').reduce((sum, p) => sum + (p.amount || 0), 0) || 0)))}</p>
                                  </div>
                                </div>
                                
                                {transaction.payments && transaction.payments.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Payments</h4>
                                    <div className="space-y-2">
                                      {transaction.payments.map((payment: Payment, pidx: number) => (
                                        <div key={pidx} className="text-sm p-2 bg-white rounded border">
                                          <p><strong>Amount:</strong> ₹{payment.amount}</p>
                                          <p><strong>Method:</strong> {payment.method}</p>
                                          <p><strong>Status:</strong> {payment.status}</p>
                                          <p><strong>From:</strong> {payment.payer_type}</p>
                                          <p><strong>To:</strong> {payment.payee_type}</p>
                                          {payment.created_at && (
                                            <p><strong>Date:</strong> {formatDisplayDate(payment.created_at)}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            ← Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}

export default TransactionManagement;