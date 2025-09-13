import React, { useState, useEffect } from 'react';
import { transactionsApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { paymentsApi } from '../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface User {
  id: string;
  username: string;
  role: 'farmer' | 'buyer';
  balance: number;
  contact?: string;
}

const BalanceManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: '',
    transaction_id: ''
  });
  // For bulk payments
  const [selectedTransactions, setSelectedTransactions] = useState<any[]>([]); // [{id, amount}]
  const [totalBulkAmount, setTotalBulkAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  // Only show transactions that are not closed and have unpaid amount
  const payableTransactions = userTransactions.filter(t => {
    const unpaid = t.unpaid_amount ?? (t.total_sale_value - (t.paid_amount || 0));
    return (t.status === 'pending' || unpaid > 0);
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/users?include_balance=true&shop_id=1', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.filter((u: any) => ['farmer', 'buyer'].includes(u.role)));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch transactions for selected user
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedUser) {
        setUserTransactions([]);
        return;
      }
      let params: any = { limit: 50 };
      if (selectedUser.role === 'farmer') params.farmer_id = selectedUser.id;
      if (selectedUser.role === 'buyer') params.buyer_id = selectedUser.id;
      try {
        const res = await transactionsApi.getAll(params);
        setUserTransactions(res.data || []);
      } catch (err) {
        setUserTransactions([]);
      }
    };
    fetchTransactions();
    setPaymentForm(f => ({ ...f, transaction_id: '' }));
  }, [selectedUser]);

  // Bulk payment handler
  const handleBulkPayment = async () => {
    if (!selectedUser || selectedTransactions.length === 0) return;
    setLoading(true);
    try {
      const isFarmer = selectedUser.role === 'farmer';
      const payload = {
        payments: selectedTransactions.map(t => ({ transaction_id: t.id, amount: parseFloat(t.amount) })),
        payer_type: (isFarmer ? 'SHOP' : 'BUYER') as 'SHOP' | 'BUYER',
        payee_type: (isFarmer ? 'FARMER' : 'SHOP') as 'SHOP' | 'FARMER',
        method: 'CASH',
        status: 'PAID',
        notes: paymentForm.description || `Bulk payment ${isFarmer ? 'to' : 'from'} ${selectedUser.username}`
      };
      const res = await paymentsApi.createBulk(payload);
      if (res && res.success) {
        setShowPaymentDialog(false);
        setPaymentForm({ amount: '', description: '', transaction_id: '' });
        setSelectedTransactions([]);
        setTotalBulkAmount('');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error processing bulk payment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Improved: Auto-select transactions to match entered total, allocate payment, and prevent over-allocation
  const [bulkWarning, setBulkWarning] = useState('');
  useEffect(() => {
    if (!totalBulkAmount || userTransactions.length === 0) return;
    let remaining = parseFloat(totalBulkAmount);
    let autoSelected: any[] = [];
    let totalAvailable = 0;
    for (const t of userTransactions) {
      const unpaid = t.unpaid_amount ?? (t.total_sale_value - (t.paid_amount || 0));
      if (unpaid <= 0) continue;
      if (remaining > 0) {
        const alloc = Math.min(unpaid, remaining);
        autoSelected.push({ id: t.id, amount: alloc.toFixed(2) });
        remaining -= alloc;
        totalAvailable += unpaid;
      }
    }
    setSelectedTransactions(autoSelected);
    if (parseFloat(totalBulkAmount) > totalAvailable) {
      setBulkWarning('Entered amount exceeds total outstanding for all transactions.');
    } else {
      setBulkWarning('');
    }
  }, [totalBulkAmount, userTransactions]);

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Balance Management</h1>
          <p className="text-gray-600">Manage user balances and payments</p>
        </div>
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select User</label>
                <Select
                  value={selectedUser ? String(selectedUser.id) : ''}
                  onValueChange={(value) => {
                    const user = users.find(u => String(u.id) === value);
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

                {/* Show how much is owed */}
                {selectedUser && (
                  <div className="mt-2 text-sm">
                    {selectedUser.role === 'farmer' ? (
                      <span>
                        <span className="font-semibold text-red-600">Shop owes this farmer: </span>
                        <span className="font-bold">₹{Math.abs(selectedUser.balance).toLocaleString()}</span>
                        {selectedUser.balance >= 0 ? '' : ' (advance paid)'}
                      </span>
                    ) : (
                      <span>
                        <span className="font-semibold text-green-600">Buyer owes shop: </span>
                        <span className="font-bold">₹{Math.abs(selectedUser.balance).toLocaleString()}</span>
                        {selectedUser.balance <= 0 ? '' : ' (advance received)'}
                      </span>
                    )}
                  </div>
                )}
              </div>



              {/* Bulk transaction selector with total and auto-distribute */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Transactions (Bulk)</label>
                <div className="mb-2">
                  <span className="text-xs text-gray-600">
                    Selected total: ₹{
                      selectedTransactions
                        .map(st => {
                          const tx = userTransactions.find(t => t.id === st.id);
                          return tx ? (tx.unpaid_amount ?? (tx.total_sale_value - (tx.paid_amount || 0))) : 0;
                        })
                        .reduce((a, b) => a + b, 0)
                        .toLocaleString()
                    }
                  </span>
                </div>
                <div className="mb-2">
                  <label className="block text-xs font-medium mb-1">Total Payment Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={totalBulkAmount}
                    onChange={e => setTotalBulkAmount(e.target.value)}
                    placeholder="Enter total payment to distribute"
                  />
                  <span className="text-xs text-gray-500">Auto-selects and distributes across transactions. You can adjust individual amounts below.</span>
                  {bulkWarning && <div className="text-xs text-red-600 mt-1">{bulkWarning}</div>}
                </div>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {payableTransactions.map(t => {
                    const selected = selectedTransactions.find(st => st.id === t.id);
                    const unpaid = t.unpaid_amount ?? (t.total_sale_value - (t.paid_amount || 0));
                    return (
                      <div key={t.id} className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          disabled={!!totalBulkAmount} // disable manual selection when total entered
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedTransactions(prev => [...prev, { id: t.id, amount: unpaid.toFixed(2) }]);
                            } else {
                              setSelectedTransactions(prev => prev.filter(st => st.id !== t.id));
                            }
                          }}
                        />
                        <span className="text-xs">#{t.id} - {t.product_name} | {t.quantity} x ₹{t.unit_price} | {t.status} | <b>₹{unpaid.toLocaleString()}</b></span>
                        {selected && (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24 ml-2"
                            placeholder="Amount"
                            value={selected.amount}
                            onChange={e => {
                              const val = e.target.value;
                              setSelectedTransactions(prev => prev.map(st => st.id === t.id ? { ...st, amount: val } : st));
                            }}
                            disabled={!!totalBulkAmount}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>



              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Payment description (optional)"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBulkPayment}
                  disabled={loading || !selectedUser || selectedTransactions.length === 0 || selectedTransactions.some(st => !st.amount)}
                >
                  {loading ? 'Processing...' : 'Record Bulk Payment'}
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Positive Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{users.filter(u => u.balance > 0).reduce((sum, u) => sum + u.balance, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Negative Balance</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{Math.abs(users.filter(u => u.balance < 0).reduce((sum, u) => sum + u.balance, 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${getBalanceColor(users.reduce((sum, u) => sum + u.balance, 0))}`}>
                  ₹{users.reduce((sum, u) => sum + u.balance, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'farmer' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.contact || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${getBalanceColor(user.balance)}`}>
                      ₹{user.balance.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPaymentDialog(true);
                      }}
                    >
                      Add Payment
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceManagement;