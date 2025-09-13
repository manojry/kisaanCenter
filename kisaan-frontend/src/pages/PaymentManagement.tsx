import React, { useState, useEffect } from 'react';
import { usersApi, paymentsApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PaymentManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
  // Remove include_balance, just fetch all users and filter
  const res = await usersApi.getAll({});
  setUsers(res.data.filter((u: any) => ['farmer', 'buyer'].includes(u.role)));
    };
    fetchUsers();
  }, []);

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

  const handleAdvancePayment = async () => {
    if (!selectedUser || !advanceAmount) return;
    setLoading(true);
    try {
      const payload = {
        transaction_id: undefined,
        payer_type: 'SHOP',
        payee_type: 'FARMER',
        amount: parseFloat(advanceAmount),
        method: 'CASH',
        status: 'PAID',
        notes: `Advance payment to ${selectedUser.username}`
      };
      const res = await paymentsApi.create(payload);
      if (res && res.success) {
        setMessage('Advance payment recorded!');
        setAdvanceAmount('');
      }
    } catch (error) {
      setMessage('Error processing advance payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Payment Management</h1>
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
                    {snapshots.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{new Date(s.snapshot_date).toLocaleDateString()}</TableCell>
                        <TableCell>₹{Number(s.balance).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
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
              <Button
                onClick={handleAdvancePayment}
                disabled={loading || !advanceAmount}
              >
                {loading ? 'Processing...' : 'Record Advance Payment'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
      {message && <div className="mt-4 text-center text-blue-600 font-semibold">{message}</div>}
    </div>
  );
};

export default PaymentManagement;
