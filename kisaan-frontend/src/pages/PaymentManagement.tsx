import React, { useState, useEffect } from 'react';
import { paymentsApi } from '../services/api';
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
  const { users: allUsers, isLoading: usersLoading } = useUsers();
  const users = allUsers.filter((u: any) => ['farmer', 'buyer'].includes(u.role));
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [advanceMethod, setAdvanceMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Removed local fetchUsers; using users from context

  useEffect(() => {
    if (!selectedUser) {
      setSnapshots([]);
      setPayments([]);
      return;
    }
    const fetchSnapshots = async () => {
      const res = await fetch(`/api/balance-snapshots/${selectedUser.id}`);
      const data = await res.json();
      setSnapshots(data.data || []);
    };
    const fetchPayments = async () => {
  // Use payer_type or payee_type to filter payments for user
  const res = await paymentsApi.getAll({ payer_type: selectedUser.role.toUpperCase() });
  setPayments(res.data || []);
    };
    fetchSnapshots();
    fetchPayments();
    setAdvanceAmount('');
    setMessage('');
  }, [selectedUser]);

  // No transaction selection or bulk payment logic needed for bookkeeping mode

  // No bulk payment handler needed

  const handlePayment = async () => {
    if (!selectedUser || !paymentAmount || !shopId) return;
    setLoading(true);
    try {
      let payload: any;
      if (selectedUser.role === 'farmer') {
        payload = {
          payer_type: "SHOP",
          payee_type: "FARMER",
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          status: 'PAID',
          notes: `Payment to ${selectedUser.username}`,
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
          notes: `Payment from ${selectedUser.username}`,
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
      } else if (res && res.message) {
        setMessage(`Error: ${res.message}`);
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error processing payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancePayment = async () => {
    if (!selectedUser || !advanceAmount || !shopId) return;
    setLoading(true);
    try {
      const payload: any = {
        payer_type: "SHOP" as const,
        payee_type: "FARMER" as const,
        amount: parseFloat(advanceAmount),
        method: advanceMethod,
        status: 'PAID',
        notes: `Advance payment to ${selectedUser.username}`,
        counterparty_id: Number(selectedUser.id),
        shop_id: shopId
      };
      const res = await paymentsApi.create(payload);
      if (res && res.success) {
        setMessage('Advance payment recorded!');
        setAdvanceAmount('');
      } else if (res && res.message) {
        setMessage(`Error: ${res.message}`);
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error processing advance payment.');
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
      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedUser ? String(selectedUser.id) : ''}
            onValueChange={val => {
              const user = users.find(u => String(u.id) === val);
              setSelectedUser(user || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.username} ({user.role}) - ₹{user.balance.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedUser && (
            <div className="mt-2 text-sm">
              {selectedUser.role === 'farmer' && selectedUser.balance < 0 ? (
                <span className="font-semibold text-blue-600">Advance paid: ₹{Math.abs(selectedUser.balance).toLocaleString()}</span>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">₹{selectedUser.balance.toLocaleString()}</div>
              <div className="text-xs text-gray-500">(Running balance as per latest snapshot and activity)</div>
            </CardContent>
          </Card>
          <Card className="mt-4">
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
                      // Robust date parsing
                      let dateStr = '';
                      if (s.snapshot_date) {
                        const d = new Date(s.snapshot_date);
                        dateStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString();
                      }
                      // Robust number parsing
                      const bal = typeof s.balance === 'number' ? s.balance : parseFloat(s.balance);
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
          <Card className="mt-4">
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
          {/* Advance Payment Section */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                {selectedUser.role === 'farmer' ? 'Record Payment to Farmer' : 'Receive Payment from Buyer'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">
                  {selectedUser.role === 'farmer' ? 'Payment Amount' : 'Amount Received'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder={selectedUser.role === 'farmer' ? 'Enter payment amount' : 'Enter amount received'}
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">Payment Method</label>
                <select
                  className="block w-full border rounded p-2 text-sm"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">Bank</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Button
                onClick={handlePayment}
                disabled={loading || !paymentAmount}
                className={loading ? 'opacity-60 cursor-not-allowed' : ''}
              >
                {loading ? (
                  <span className="flex items-center"><span className="loader mr-2"></span>Processing...</span>
                ) : (selectedUser.role === 'farmer' ? 'Record Payment' : 'Receive Payment')}
              </Button>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Record Advance Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">Advance Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(e.target.value)}
                  placeholder="Enter advance amount"
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">Advance Payment Method</label>
                <select
                  className="block w-full border rounded p-2 text-sm"
                  value={advanceMethod}
                  onChange={e => setAdvanceMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">Bank</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Button
                onClick={handleAdvancePayment}
                disabled={loading || !advanceAmount}
                className={loading ? 'opacity-60 cursor-not-allowed' : ''}
              >
                {loading ? (
                  <span className="flex items-center"><span className="loader mr-2"></span>Processing...</span>
                ) : 'Record Advance Payment'}
              </Button>
            </CardContent>
          </Card>
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
