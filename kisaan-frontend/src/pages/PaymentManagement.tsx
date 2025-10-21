import { getUserDisplayWithRoleAndId } from '../utils/userDisplayName';
import type { BalanceSnapshot, User } from '../types/api';
import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/formatDate';
import { paymentsApi, balanceSnapshotsApi } from '../services/api';
import { useUsers } from '../context/useUsers';
import { useAuth } from '../context/AuthContext';
import { fetchOwnerShop } from '../utils/shopUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserSearchDropdown } from '@/components/ui/UserSearchDropdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SettlementBreakdownCard } from '@/components/ui/SettlementBreakdownCard';
import { Badge } from '@/components/ui/badge';
import { History, ArrowUpDown, CreditCard, Receipt, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';

const PaymentManagement: React.FC = () => {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const [shopId, setShopId] = useState<number | null>(null);
  // Fetch the owner's shop_id on mount
  useEffect(() => {
    const fetchShop = async () => {
      if (user && user.role === 'owner') {
        const shop = await fetchOwnerShop(user.id, user.shop_id);
        setShopId(shop?.id || null);
      }
    };
    fetchShop();
  }, [user]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated || !hasRole('owner')) {
    return <div className="p-8 text-center text-red-600 font-bold">Unauthorized: Only owners can access this page.</div>;
  }
  const { users, refreshUsers } = useUsers();

  // Ensure users are fetched for the dropdown
  useEffect(() => {
    if (isAuthenticated && hasRole('owner')) {
      refreshUsers();
    }
  }, [isAuthenticated, refreshUsers]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Remove top-level role filter; direction is chosen inline based on selected user
  const [searchRole] = useState<'farmer' | 'buyer' | 'all'>('all');
  // ...existing code...
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  // direction chooser modal state (ask user whether this is a receive or pay)
  // Remove direction modal; payment direction is now explicit and inline
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([]);
  const [payments, setPayments] = useState<import('../types/api').Payment[]>([]);
  const [expensesData, setExpensesData] = useState<null | {
    totalExpenses: number;
    totalSettled: number;
    totalUnsettled: number;
    expenses: Array<{
      id: number;
      amount: number;
      settled: number;
      unsettled: number;
      description: string;
      created_at: string;
      status: string;
    }>;
  }>(null);
  const [settlementBreakdown, setSettlementBreakdown] = useState<{
    applied_to_expenses: number;
    applied_to_balance: number;
    fifo_result?: {
      settlements?: {
        expense_id: number;
        amount_settled: number;
        expense_date?: string;
        reason?: string;
      }[];
      remaining?: number;
    };
  } | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  // modal removed; inline override checkbox used instead
  const [forceOverride, setForceOverride] = useState(false);
  // Inline direction selector: controls whether this is shop->farmer (pay) or receive (from buyer/farmer)
  const [paymentDirection, setPaymentDirection] = useState<'pay_to_farmer' | 'receive_from_buyer' | 'receive_from_farmer'>('pay_to_farmer');
  const [currentPage, setCurrentPage] = useState(1);
  const [snapshotsPage, setSnapshotsPage] = useState(1);
  const itemsPerPage = 8;

  // Removed local fetchUsers; using users from context

  useEffect(() => {
    if (!selectedUser) {
      setSnapshots([]);
      setPayments([]);
      setSettlementBreakdown(null);
      setCurrentPage(1);
      setSnapshotsPage(1);
      setCurrentBalance(0);
      return;
    }
    const fetchSnapshots = async () => {
      const snapshotsData = await balanceSnapshotsApi.getByUserId(selectedUser.id);
      setSnapshots(snapshotsData);
      
      // Calculate current balance from the most recent snapshot
      if (snapshotsData && snapshotsData.length > 0) {
        // Sort by created date descending to get the most recent
        const sortedSnapshots = [...snapshotsData].sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
        const latestSnapshot = sortedSnapshots[0];
        const currentBalanceValue = Number(latestSnapshot.new_balance || 0);
        setCurrentBalance(currentBalanceValue);
      } else {
        setCurrentBalance(0);
      }
    };
    const fetchPayments = async () => {
      // Fetch payments specific to the user role
      let res;
      if (selectedUser.role === 'farmer') {
        res = await paymentsApi.getFarmerPayments(selectedUser.id);
        const data = res.data || {};
        // API may return either an array (legacy) or an object { payments, expenses }
        if (Array.isArray(data)) {
          setPayments(data);
          setExpensesData(null);
        } else {
          setPayments(((data as any).payments) || []);
          setExpensesData(((data as any).expenses) || null);
        }
      } else if (selectedUser.role === 'buyer') {
        res = await paymentsApi.getBuyerPayments(selectedUser.id);
        setPayments(res.data || []);
        setExpensesData(null);
      } else {
        res = { data: [] };
        setPayments([]);
        setExpensesData(null);
      }
    };
    fetchSnapshots();
    fetchPayments();
  // Advance payment state removed
    setMessage('');
    setSettlementBreakdown(null);
  }, [selectedUser]);

  // Auto-adjust paymentDirection for farmers with negative balance (they owe the shop)
  useEffect(() => {
    if (!selectedUser) return;
    if (selectedUser.role === 'farmer' && currentBalance < 0) {
      // Farmer owes shop -> prefer Receive from Farmer (farmer pays shop)
      if (paymentDirection === 'pay_to_farmer') {
        setPaymentDirection('receive_from_farmer');
        setMessage('Farmer has an outstanding advance — defaulting action to Receive from Farmer.');
      }
    }
  }, [selectedUser, currentBalance]);

  // No transaction selection or bulk payment logic needed for bookkeeping mode

  // No bulk payment handler needed

  const handlePayment = async (directionParam: 'pay' | 'receive', forceOverrideFlag: boolean = false) => {
    if (!selectedUser || !paymentAmount || !shopId) return;
    setLoading(true);
    try {
      type PaymentPayload = {
        // allow buyer/farmer/shop as payer for flexibility
        payer_type: 'shop' | 'buyer' | 'farmer';
        payee_type: 'shop' | 'farmer';
        amount: number;
        method: string;
        status: 'PAID';
        notes: string;
        counterparty_id: number;
        shop_id: number;
        payment_date: string;
          force_override?: boolean | undefined;
      };
      let payload: PaymentPayload;
      // directionParam indicates whether this is a shop->user payment ('pay') or user->shop ('receive')
      if (directionParam === 'pay') {
        // Shop pays the selected user
        payload = {
          payer_type: 'shop',
          payee_type: selectedUser.role === 'farmer' ? 'farmer' : 'shop',
          amount: parseFloat(paymentAmount),
          method: paymentMethod.toLowerCase(),
          status: 'PAID',
          notes: `Payment to ${getUserDisplayWithRoleAndId(selectedUser)}` + (forceOverrideFlag ? ' (force_override)' : ''),
          counterparty_id: Number(selectedUser.id),
          shop_id: Number(shopId),
          payment_date: new Date().toISOString()
        };
      } else {
        // receive: user pays the shop
        payload = {
          payer_type: selectedUser.role === 'buyer' ? 'buyer' : 'farmer',
          payee_type: 'shop',
          amount: parseFloat(paymentAmount),
          method: paymentMethod.toLowerCase(),
          status: 'PAID',
          notes: `Payment from ${getUserDisplayWithRoleAndId(selectedUser)}`,
          counterparty_id: Number(selectedUser.id),
          shop_id: Number(shopId),
          payment_date: new Date().toISOString()
        };
      }
      const res = await paymentsApi.create(payload);
      if (res && res.success) {
        // Capture settlement breakdown from API response
        if (res.data && typeof res.data === 'object' && 'applied_to_expenses' in res.data) {
          setSettlementBreakdown({
            applied_to_expenses: res.data.applied_to_expenses || 0,
            applied_to_balance: res.data.applied_to_balance || 0,
            fifo_result: res.data.fifo_result || undefined
          });
        }
        setMessage('Payment recorded successfully!');
        setPaymentAmount('');
        // Refresh users, snapshots, and payments after payment
  await refreshUsers();
        if (selectedUser) {
          const snapshotsData = await balanceSnapshotsApi.getByUserId(selectedUser.id);
          setSnapshots(snapshotsData);
          
          // Fetch payments for the selected user (either as farmer or buyer)
          let payRes;
          if (selectedUser.role === 'farmer') {
            payRes = await paymentsApi.getFarmerPayments(selectedUser.id);
            // Handle API shapes like { payments, expenses } or legacy array
            const refreshed = payRes.data || {};
            if (Array.isArray(refreshed)) {
              setPayments(refreshed);
              setExpensesData(null);
            } else {
              setPayments(((refreshed as any).payments) || []);
              setExpensesData(((refreshed as any).expenses) || null);
            }
            } else if (selectedUser.role === 'buyer') {
              payRes = await paymentsApi.getBuyerPayments(selectedUser.id);
              setPayments(payRes.data || []);
              setExpensesData(null);
            } else {
              payRes = { data: [] };
              setPayments([]);
              setExpensesData(null);
            }
          // Refetch selectedUser to get updated balance from global users
          const updatedUser = users.find((u) => u.id === selectedUser.id);
          if (updatedUser) setSelectedUser(updatedUser);
        }
      } else if (res && res.message) {
        setMessage(`Error: ${res.message}`);
      }
    } catch (error) {
      const msg = error && typeof error === 'object' && 'response' in error && (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      setMessage(typeof msg === 'string' ? msg : 'Error processing payment.');
    } finally {
      setLoading(false);
    }
  };

  // Inline payment direction: for buyers, always receive; for farmers, always pay
  const onRecordClick = () => {
    if (!selectedUser) return;
    // Determine effective direction from inline selector
    if (paymentDirection === 'pay_to_farmer') {
      // pay shop -> farmer
      // If farmer currently has negative balance (advance), require override to allow increasing debt
      if (currentBalance < 0 && !forceOverride) {
        setMessage('Farmer has a negative balance (advance). Enable Override to allow this payment to increase farmer debt.');
        return;
      }
      handlePayment('pay', forceOverride);
    } else if (paymentDirection === 'receive_from_buyer') {
      handlePayment('receive', false);
    } else if (paymentDirection === 'receive_from_farmer') {
      // receiving from farmer: user pays shop
      handlePayment('receive', false);
    }
  };

  // No longer needed: confirmDirectionAndSend (direction is explicit)


  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Payment Management</h1>
        <p className="text-sm text-gray-600">Record payments to farmers or receive payments from buyers</p>
      </div>

      {/* User Selection and Balance */}
      <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
            <span className="font-medium text-sm">Select User:</span>
            <div className="flex items-center gap-2">
              {/* Removed top role filter buttons — selection is done via the user dropdown */}
              <UserSearchDropdown
                onSelect={setSelectedUser}
                placeholder="Search user by name or phone"
                roleFilter={searchRole}
              />
            </div>
          </div>
              {selectedUser && (
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 px-3 py-2 rounded">
                <span className="text-sm text-gray-600">Current Balance:</span>
                <span className="ml-2 font-bold text-lg">₹{currentBalance.toLocaleString()}</span>
              </div>
              {selectedUser.role === 'farmer' && currentBalance < 0 && (
                <div className="bg-blue-50 px-3 py-2 rounded">
                  <span className="text-sm text-blue-600">Advance: ₹{Math.abs(currentBalance).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Balance History and Payment Form */}
          <div className="space-y-6">
            {/* Balance Changes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-4 w-4" />
                  Balance Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <History className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                    <div>No balance changes yet</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Compact Recent Activity */}
                    <div className="bg-green-50 p-2 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-700">Latest Change</span>
                        <span className="text-green-600">
                          ₹{Number(snapshots[0]?.previous_balance || 0).toLocaleString()} → ₹{Number(snapshots[0]?.new_balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Compact Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="text-xs px-2 py-1">Date</TableHead>
                            <TableHead className="text-xs px-2 py-1">Type</TableHead>
                            <TableHead className="text-xs px-2 py-1 text-right">Before</TableHead>
                            <TableHead className="text-xs px-2 py-1 text-right">Change</TableHead>
                            <TableHead className="text-xs px-2 py-1 text-right">After</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const startIndex = (snapshotsPage - 1) * itemsPerPage;
                            const endIndex = startIndex + itemsPerPage;
                            const paginatedSnapshots = snapshots.slice(startIndex, endIndex);
                            
                            return paginatedSnapshots.map(s => {
                              let dateStr = '';
                              const dateVal = s.createdAt || s.created_at;
                              if (dateVal) {
                                dateStr = formatDate(dateVal);
                              }
                              
                              const prev = Number(s.previous_balance || 0);
                              const change = Number(s.amount_change || 0);
                              const next = Number(s.new_balance || 0);
                              
                              const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
                              
                              // Compact transaction icon
                              const getCompactIcon = (type?: string) => {
                                switch (type?.toLowerCase()) {
                                  case 'payment': return <CreditCard className="h-3 w-3 text-blue-600" />;
                                  case 'expense': return <Receipt className="h-3 w-3 text-red-600" />;
                                  default: return <ArrowUpDown className="h-3 w-3 text-gray-600" />;
                                }
                              };
                              
                              return (
                                <TableRow key={s.id} className="h-8 hover:bg-gray-50">
                                  <TableCell className="text-xs px-2 py-1 font-medium">{dateStr}</TableCell>
                                  <TableCell className="px-2 py-1">
                                    <div className="flex items-center gap-1">
                                      {getCompactIcon(s.transaction_type)}
                                      <span className="text-xs">{s.transaction_type || 'Update'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs px-2 py-1 text-right font-mono">₹{prev.toFixed(0)}</TableCell>
                                  <TableCell className={`text-xs px-2 py-1 text-right font-mono font-medium ${changeColor}`}>
                                    {change >= 0 ? '+' : ''}₹{Math.abs(change).toFixed(0)}
                                  </TableCell>
                                  <TableCell className="text-xs px-2 py-1 text-right font-mono font-medium">₹{next.toFixed(0)}</TableCell>
                                </TableRow>
                              );
                            });
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {snapshots.length > itemsPerPage && (
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                          Showing {Math.min((snapshotsPage - 1) * itemsPerPage + 1, snapshots.length)} to {Math.min(snapshotsPage * itemsPerPage, snapshots.length)} of {snapshots.length} changes
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => setSnapshotsPage(Math.max(1, snapshotsPage - 1))}
                            disabled={snapshotsPage === 1}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-gray-600 px-2">
                            {snapshotsPage} / {Math.ceil(snapshots.length / itemsPerPage)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => setSnapshotsPage(Math.min(Math.ceil(snapshots.length / itemsPerPage), snapshotsPage + 1))}
                            disabled={snapshotsPage === Math.ceil(snapshots.length / itemsPerPage)}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-4 w-4" />
                  {selectedUser.role === 'farmer' ? 'Record Payment to Farmer' : 'Receive Payment from Buyer'}
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Manage payments with this user. You can either record a payment the shop makes to them (Pay), or record a payment received from them to the shop (Receive).
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Payment Preview */}
                    {paymentAmount && parseFloat(paymentAmount) > 0 && (
                    (() => {
                      const amt = Math.abs(parseFloat(paymentAmount));
                      // For pay_to_farmer: shop -> farmer, farmer balance increases by amt
                      // For receive_from_*: user -> shop, user balance decreases by amt
                      const newBalance = paymentDirection === 'pay_to_farmer' ? currentBalance + amt : currentBalance - amt;
                      // Overpayment: when receiving from user and user does not have enough balance (i.e., receiving more than their positive balance)
                      const isOverpay = (paymentDirection === 'receive_from_farmer' || paymentDirection === 'receive_from_buyer') && amt > currentBalance;
                      const bgClass = isOverpay ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
                      const headerColor = isOverpay ? 'text-red-700' : 'text-blue-700';

                      return (
                        <div className={`p-3 rounded-lg border ${bgClass}`}>
                          <div className={`flex items-center gap-2 font-medium text-sm mb-2 ${headerColor}`}>
                            <TrendingDown className="h-4 w-4" />
                            Payment Impact
                            {isOverpay && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">
                                ⚠️ Overpayment - balance will go negative
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-gray-600 text-xs">Current</div>
                              <div className="font-mono font-bold">₹{currentBalance.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-gray-600 text-xs">Payment</div>
                              <div className="font-mono font-bold text-red-600">{paymentDirection === 'pay_to_farmer' ? '+₹' + amt.toLocaleString() : '-₹' + amt.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-gray-600 text-xs">New Balance</div>
                              <div className={`font-mono font-bold ${newBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{newBalance.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {isOverpay && (
                            <div className="mt-2 text-xs text-red-600">
                              This payment exceeds the user's current balance and will make their balance negative.
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex flex-col w-24 min-w-[6rem]">
                        <label className="text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentAmount}
                          onChange={e => {
                            // ensure amount stored as a positive string
                            const raw = e.target.value || '';
                            const n = parseFloat(raw);
                            if (!isNaN(n)) setPaymentAmount(String(Math.abs(n))); else setPaymentAmount(raw);
                          }}
                          placeholder="Enter"
                          className="w-full"
                        />
                      </div>
                      {/* Direction chooser inline */}
                      <div className="flex flex-col w-44 min-w-[10rem]">
                        <label className="text-sm font-medium text-gray-700 mb-1">Action</label>
                        <select
                          className="border rounded px-2 py-2 text-sm w-full"
                          value={paymentDirection}
                          onChange={e => setPaymentDirection(e.target.value as any)}
                        >
                          <option value="pay_to_farmer" disabled={selectedUser?.role === 'farmer' && currentBalance < 0 && !forceOverride}>Pay to Farmer</option>
                          <option value="receive_from_buyer">Receive from Buyer</option>
                          <option value="receive_from_farmer">Receive from Farmer</option>
                        </select>
                      </div>
                      <div className="flex flex-col w-36 min-w-[8rem]">
                        <label className="text-sm font-medium text-gray-700 mb-1">Method</label>
                        <select
                          className="border rounded px-2 py-2 text-sm w-full"
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-2">
                          <input id="force-override" type="checkbox" checked={forceOverride} onChange={e => setForceOverride(e.target.checked)} />
                          <label htmlFor="force-override" className="text-sm">Override</label>
                        </div>
                        <div>
                          <Button
                            onClick={onRecordClick}
                            disabled={
                              loading || !paymentAmount || parseFloat(paymentAmount) <= 0 || !shopId ||
                              (paymentDirection === 'pay_to_farmer' && selectedUser?.role === 'farmer' && currentBalance < 0 && !forceOverride)
                            }
                            className={loading ? 'opacity-60 cursor-not-allowed' : ''}
                            size="sm"
                          >
                          {loading ? (
                            <span className="flex items-center">
                              <span className="loader mr-1"></span>
                              Processing...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {paymentDirection === 'pay_to_farmer' ? 'Pay Farmer' : paymentDirection === 'receive_from_buyer' ? 'Receive from Buyer' : 'Receive from Farmer'}
                            </span>
                          )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment History */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-4 w-4" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {payments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <Receipt className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                    <div>No payments yet</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Compact Payment Summary */}
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs">
                      <span className="font-medium">{payments.length} payments</span>
                      <span className="font-mono font-medium">â‚¹{payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</span>
                      <span className="text-green-600">{payments.filter(p => p.status === 'PAID').length} completed</span>
                    </div>

                    {/* Compact Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="text-xs px-2 py-1">Date</TableHead>
                            <TableHead className="text-xs px-2 py-1 text-right">Amount</TableHead>
                            <TableHead className="text-xs px-2 py-1">Method</TableHead>
                            <TableHead className="text-xs px-2 py-1">Direction</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => {
                            // Determine payment type from user's perspective
                            let paymentType = '';
                            let badgeColor = '';
                            
                            if (selectedUser?.role === 'farmer') {
                              // For farmers: payments received are "Received", payments made are "Paid"
                              if (p.payee_type === 'farmer') {
                                paymentType = 'Received';
                                badgeColor = 'border-green-500 text-green-700';
                              } else {
                                paymentType = 'Paid';
                                badgeColor = 'border-blue-500 text-blue-700';
                              }
                            } else if (selectedUser?.role === 'buyer') {
                              // For buyers: payments made are "Paid", payments received are "Received"
                              if (p.payer_type === 'buyer') {
                                paymentType = 'Paid';
                                badgeColor = 'border-blue-500 text-blue-700';
                              } else {
                                paymentType = 'Received';
                                badgeColor = 'border-green-500 text-green-700';
                              }
                            }
                            
                            return (
                              <TableRow key={p.id} className="h-8 hover:bg-gray-50">
                                <TableCell className="text-xs px-2 py-1 font-medium">{formatDate(p.created_at)}</TableCell>
                                <TableCell className="text-xs px-2 py-1 text-right font-mono font-medium">₹{Number(p.amount).toFixed(0)}</TableCell>
                                <TableCell className="px-2 py-1">
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    {p.method}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-2 py-1">
                                  <Badge variant="outline" className={`text-xs px-1 py-0 ${badgeColor}`}>
                                    {paymentType}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Payment Pagination Controls */}
                    {payments.length > itemsPerPage && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-gray-500">
                          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, payments.length)} to {Math.min(currentPage * itemsPerPage, payments.length)} of {payments.length} payments
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="h-7 px-2"
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <span className="text-xs px-2">
                            {currentPage} / {Math.ceil(payments.length / itemsPerPage)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(Math.min(Math.ceil(payments.length / itemsPerPage), currentPage + 1))}
                            disabled={currentPage === Math.ceil(payments.length / itemsPerPage)}
                            className="h-7 px-2"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* Expenses removed from here and rendered as a full-width section after the grid to prevent overlap */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Full-width Expenses section to avoid overlapping the payment form */}
      {expensesData && (
        <div className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-4 w-4" />
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-2 text-sm text-gray-600">
                Total: <strong>₹{expensesData.totalExpenses.toLocaleString()}</strong>
                <span className="ml-4">Unsettled: <strong>₹{expensesData.totalUnsettled.toLocaleString()}</strong></span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs px-2 py-1">Date</TableHead>
                      <TableHead className="text-xs px-2 py-1">Amount</TableHead>
                      <TableHead className="text-xs px-2 py-1">Settled</TableHead>
                      <TableHead className="text-xs px-2 py-1">Unsettled</TableHead>
                      <TableHead className="text-xs px-2 py-1">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesData.expenses.map((e: {
                      id: number;
                      created_at: string;
                      amount: number;
                      settled: number;
                      unsettled: number;
                      status: string;
                    }) => (
                      <TableRow key={e.id} className="h-8 hover:bg-gray-50">
                        <TableCell className="text-xs px-2 py-1">{formatDate(e.created_at)}</TableCell>
                        <TableCell className="text-xs px-2 py-1">₹{e.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs px-2 py-1">₹{e.settled.toLocaleString()}</TableCell>
                        <TableCell className="text-xs px-2 py-1">₹{e.unsettled.toLocaleString()}</TableCell>
                        <TableCell className="text-xs px-2 py-1"><Badge>{e.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Settlement Breakdown Display */}
      {settlementBreakdown && (
        <SettlementBreakdownCard settlementBreakdown={settlementBreakdown} />
      )}
      {message && (
        <div className={
          message.toLowerCase().includes('error')
            ? 'mt-4 text-center text-red-600 font-semibold'
            : 'mt-4 text-center text-green-600 font-semibold'
        }>
          {message}
        </div>
      )}
<style>
  {`
    .loader {
      border: 2px solid #cbd5e1;
      border-top: 2px solid #2563eb;
      border-radius: 50%;
      width: 1em;
      height: 1em;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
</style>
    </div>
  );
};

export default PaymentManagement;
