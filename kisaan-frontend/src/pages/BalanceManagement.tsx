import React, { useState, useEffect } from 'react';
import { transactionsApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { paymentsApi } from '../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 // import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Wallet, TrendingDown } from 'lucide-react';

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
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
  const response = await fetch('http://localhost:3000/api/users?include_balance=true&shop_id=7', {
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


  // Fetch users only once on mount
  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch balance snapshots for selected user
  useEffect(() => {
    if (!selectedUser) {
      setSnapshots([]);
      return;
    }
    setSnapshotsLoading(true);
    fetch(`/api/balance-snapshots/${selectedUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          // Only keep snapshots with amount_change != 0 or previous_balance != new_balance
          const filtered = data.data.filter((s: any) =>
            parseFloat(s.amount_change) !== 0 || s.previous_balance !== s.new_balance
          );
          setSnapshots(filtered);
        } else {
          setSnapshots([]);
        }
      })
      .catch(() => setSnapshots([]))
      .finally(() => setSnapshotsLoading(false));
  }, [selectedUser]);
  // Always show as amount owed (red or gray only)
  const getBalanceColor = (balance: number) => {
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Balance Management</h1>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
        <strong>Instructions:</strong> View balances for all users. To record or manage payments, use the <b>Payments</b> page.
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedUser ? String(selectedUser.id) : ''}
            onValueChange={val => {
              const user = users.find(u => String(u.id) === String(val));
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
        </CardContent>
      </Card>
      {selectedUser && (
        <>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Amount Owed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-red-600">
                ₹{Math.abs(selectedUser.balance).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">(Amount the shop owes this user or is owed by buyer)</div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Balance Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
              {snapshotsLoading ? (
                <div>Loading snapshots...</div>
              ) : snapshots.length === 0 ? (
                <div>No balance changes to display.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prev Balance</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>New Balance</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.map(s => {
                      // Handle date parsing
                      let dateStr = '';
                      if (s.createdAt) {
                        const d = new Date(s.createdAt);
                        dateStr = isNaN(d.getTime()) ? '' : d.toLocaleString();
                      }
                      // Robust number parsing with fallback
                      function safeNumber(val: any) {
                        const n = typeof val === 'number' ? val : parseFloat(val);
                        return isNaN(n) ? 0 : n;
                      }
                      const prev = safeNumber(s.previous_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                      const change = safeNumber(s.amount_change).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                      const next = safeNumber(s.new_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                      return (
                        <TableRow key={s.id}>
                          <TableCell>{dateStr}</TableCell>
                          <TableCell>₹{prev}</TableCell>
                          <TableCell>₹{change}</TableCell>
                          <TableCell>₹{next}</TableCell>
                          <TableCell>{s.description || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
      {/* Summary Cards - Only Receivables and Payables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receivables (from Buyers)</p>
                <p className="text-2xl font-bold text-blue-600 break-words truncate max-w-[12ch] md:max-w-[20ch] lg:max-w-[28ch]" style={{overflowWrap: 'anywhere'}} title={users.filter(u => u.role === 'buyer' && u.balance > 0).reduce((sum, u) => sum + u.balance, 0).toLocaleString()}>
                  ₹{users.filter(u => u.role === 'buyer' && u.balance > 0).reduce((sum, u) => sum + u.balance, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">(Amount buyers owe to shop)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payables (to Farmers)</p>
                <p className="text-2xl font-bold text-red-600 break-words truncate max-w-[12ch] md:max-w-[20ch] lg:max-w-[28ch]" style={{overflowWrap: 'anywhere'}} title={users.filter(u => u.role === 'farmer' && u.balance > 0).reduce((sum, u) => sum + u.balance, 0).toLocaleString()}>
                  ₹{users.filter(u => u.role === 'farmer' && u.balance > 0).reduce((sum, u) => sum + u.balance, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">(Amount shop owes to farmers)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Users Table - All balances shown as amount owed */}
      <Card>
        <CardHeader>
          <CardTitle>User Amounts Owed</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Amount Owed</TableHead>
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
                    <span className={`font-semibold text-red-600`}>
                      ₹{Math.abs(user.balance).toLocaleString()}
                    </span>
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