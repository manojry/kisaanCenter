import React, { useState, useEffect } from 'react';
import { paymentsApi, balanceSnapshotsApi } from '../services/api';
import { useUsers } from '../context/UsersContext';
import { useAuth } from '../context/AuthContext';
import { fetchOwnerShop } from '../utils/shopUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PaymentManagement: React.FC = () => {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const [shopId, setShopId] = useState<number | null>(null);
  // Fetch the owner's shop_id on mount
  useEffect(() => {
    const fetchShop = async () => {
      if (user && user.role === 'owner') {
        const shop = await fetchOwnerShop(user.id);
        setShopId(shop?.id || null);
      }
    };
    fetchShop();
  }, [user]);
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated || !hasRole('owner')) {
    return <div className="p-8 text-center text-red-600 font-bold">Unauthorized: Only owners can access this page.</div>;
  }
  const { users: allUsers, fetchUsers } = useUsers();
  const users = allUsers.filter((u) => ['farmer', 'buyer'].includes(u.role));
  const [selectedUser, setSelectedUser] = useState<import('../types/api').User | null>(null);
  // ...existing code...
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  type BalanceSnapshot = {
    id: number;
    user_id: number;
    balance: number;
    created_at: string;
    createdAt?: string;
    previous_balance?: number | string;
    amount_change?: number | string;
    new_balance?: number | string;
  };
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([]); // TODO: Replace 'any' with actual snapshot type if available
  const [payments, setPayments] = useState<import('../types/api').Payment[]>([]);
  const [showHint, setShowHint] = useState(false);

  // Removed local fetchUsers; using users from context

  useEffect(() => {
    if (!selectedUser) {
      setSnapshots([]);
      setPayments([]);
      return;
    }
    const fetchSnapshots = async () => {
      const snapshotsData = await balanceSnapshotsApi.getByUserId(selectedUser.id);
      setSnapshots(snapshotsData);
    };
    const fetchPayments = async () => {
      // Fetch all payments for the shop
  const res = await paymentsApi.getAll({});
      // Filter payments where selectedUser is either payer or payee (counterparty)
      const userPayments = (res.data || []).filter((p: import('../types/api').Payment & { counterparty_id?: number }) =>
        Number((p as { counterparty_id?: number }).counterparty_id) === Number(selectedUser.id)
      );
      setPayments(userPayments);
    };
    fetchSnapshots();
    fetchPayments();
  // Advance payment state removed
    setMessage('');
  }, [selectedUser]);

  // No transaction selection or bulk payment logic needed for bookkeeping mode

  // No bulk payment handler needed

  const handlePayment = async () => {
    if (!selectedUser || !paymentAmount || !shopId) return;
    setLoading(true);
    try {
      type PaymentPayload = {
        payer_type: 'SHOP' | 'BUYER';
        payee_type: 'SHOP' | 'FARMER';
        amount: number;
        method: string;
        status: 'PAID';
        notes: string;
        counterparty_id: number;
        shop_id: number;
      };
      let payload: PaymentPayload;
      if (selectedUser.role === 'farmer') {
        payload = {
          payer_type: "SHOP",
          payee_type: "FARMER",
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          status: 'PAID',
          notes: `Payment to ${selectedUser.firstname && selectedUser.firstname.trim() ? selectedUser.firstname : selectedUser.username}`,
          counterparty_id: Number(selectedUser.id),
          shop_id: shopId
        };
      } else if (selectedUser.role === 'buyer') {
        payload = {
          payer_type: "BUYER",
          payee_type: "SHOP",
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          status: 'PAID',
          notes: `Payment from ${selectedUser.firstname && selectedUser.firstname.trim() ? selectedUser.firstname : selectedUser.username}`,
          counterparty_id: Number(selectedUser.id),
          shop_id: shopId
        };
      } else {
        setMessage('Invalid user role for payment.');
        setLoading(false);
        return;
      }
      const res = await paymentsApi.create(payload);
      if (res && res.success) {
        setMessage('Payment recorded!');
        setPaymentAmount('');
        // Refresh users, snapshots, and payments after payment
        if (fetchUsers) await fetchUsers();
        if (selectedUser) {
          const snapshotsData = await balanceSnapshotsApi.getByUserId(selectedUser.id);
          setSnapshots(snapshotsData);
          const payRes = await paymentsApi.getAll({ payer_type: selectedUser.role ? selectedUser.role.toUpperCase() : '' });
          setPayments(payRes.data || []);
          // Refetch selectedUser to get updated balance
          await fetchUsers();
          const updatedUser = allUsers.find((u) => u.id === selectedUser.id);
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


  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Payment Management</h1>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
        <strong>Instructions:</strong> As an owner, you can record payments or advance payments for any farmer or buyer. Enter the amount and submit. All calculations and bookkeeping are handled in the backend. Payment history and running balances are shown below.
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{whiteSpace: 'nowrap'}}>Select User:</span>
          <Select
            value={selectedUser ? String(selectedUser.id) : ''}
            onValueChange={val => {
              const user = users.find(u => String(u.id) === val);
              setSelectedUser(user || null);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Choose user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {(user.firstname ? user.firstname : user.username)} ({user.role}) - ₹{user.balance.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedUser && (
          <div className="flex items-center gap-4">
            <div className="bg-white border rounded px-4 py-2 shadow-sm">
              <span className="font-semibold">Current Balance: </span>
              <span className="text-lg font-bold">₹{selectedUser.balance.toLocaleString()}</span>
              <span className="text-xs text-gray-500 ml-2">(Running balance as per latest snapshot and activity)</span>
            </div>
            {selectedUser.role === 'farmer' && selectedUser.balance < 0 && (
              <span className="font-semibold text-blue-600">Advance paid: ₹{Math.abs(selectedUser.balance).toLocaleString()}</span>
            )}
          </div>
        )}
      </div>
      {selectedUser && (
        <>
          {/* Collapsible UX Explanation and Breakdown (Simple Logic) */}
          <div className="mb-4">
            <button
              className="text-blue-700 underline text-sm focus:outline-none"
              onClick={() => setShowHint(h => !h)}
            >
              {showHint ? 'Hide explanation' : 'How is this calculated?'}
            </button>
            {showHint && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-900">
                <strong>How is this balance calculated?</strong><br />
                The balance is now calculated simply: <b>Previous Balance − Payment Made = New Balance</b>.<br />
                Every payment you record directly reduces the balance by that amount. If you pay the full amount due, the balance will go to zero.<br />
                <ul className="list-disc ml-6 mt-2 text-sm">
                  <li><b>Previous Due:</b> The amount owed before your last payment.</li>
                  <li><b>Payment:</b> The amount you just paid.</li>
                  <li><b>New Due:</b> The new balance after your payment.</li>
                </ul>
                {snapshots.length > 0 && (
                  <div className="mt-2 text-xs">
                    <b>Last Change:</b> Previous Due: ₹{Number(snapshots[0].previous_balance || 0).toLocaleString()} &rarr; Payment: ₹{Math.abs(Number(snapshots[0].amount_change || 0)).toLocaleString()} &rarr; New Due: ₹{Number(snapshots[0].new_balance || 0).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Balance Snapshots</CardTitle>
                </CardHeader>
                <CardContent>
                  {snapshots.length === 0 ? <div>No snapshots found.</div> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshots.map(s => {
                          // Use createdAt or created_at for date
                          let dateStr = '';
                          const dateVal = s.createdAt || s.created_at;
                          if (dateVal) {
                            const d = new Date(dateVal);
                            dateStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString();
                          }
                          const bal = typeof s.new_balance === 'number' ? s.new_balance : parseFloat(s.new_balance ?? '0');
                          const balanceStr = isNaN(bal) ? '0.00' : bal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                          return (
                            <TableRow key={s.id}>
                              <TableCell>{dateStr}</TableCell>
                              <TableCell>₹{balanceStr}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? <div>No payments found.</div> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(p => (
                          <TableRow key={p.id}>
                            <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>₹{Number(p.amount).toLocaleString()}</TableCell>
                            <TableCell>{p.payer_type} → {p.payee_type}</TableCell>
                            <TableCell>{p.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedUser.role === 'farmer' ? 'Record Payment to Farmer' : 'Receive Payment from Buyer'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder={selectedUser.role === 'farmer' ? 'Enter payment amount' : 'Enter amount received'}
                      className="w-32"
                    />
                    <div className="flex flex-row items-end justify-between gap-2">
                      <select
                        className="border rounded p-2 text-sm min-w-[120px]"
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK">Bank</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <Button
                        onClick={handlePayment}
                        disabled={loading || !paymentAmount}
                        className={loading ? 'opacity-60 cursor-not-allowed' : ''}
                      >
                        {loading ? (
                          <span className="flex items-center"><span className="loader mr-2"></span>Processing...</span>
                        ) : (selectedUser.role === 'farmer' ? 'Record Payment' : 'Receive Payment')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Advance payment UI removed. Only regular payments remain. */}
            </div>
          </div>
        </>
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
