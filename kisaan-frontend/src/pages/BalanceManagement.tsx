import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransactionStore } from '../store/transactionStore';
import { usersApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 // import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingDown } from 'lucide-react';

interface User {
  id: string;
  username: string;
  role: 'farmer' | 'buyer';
    balance: number;
    contact?: string;
    firstname?: string;
}

interface BalanceManagementProps {
  shopId: number;
}

const BalanceManagement: React.FC<BalanceManagementProps> = ({ shopId }) => {
  const transactionStore = useTransactionStore();
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>(transactionStore.getUsers(String(shopId)));
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getAll({ shop_id: shopId });
      const userList = Array.isArray(response.data) ? response.data : [];
      const filteredUsers = userList.filter((u: any) => ['farmer', 'buyer'].includes(u.role)).map((u: any) => ({ ...u, id: String(u.id) }));
      setUsers(filteredUsers);
      transactionStore.setUsers(String(shopId), filteredUsers);
    } catch (error) {
      setUsers([]);
      transactionStore.setUsers(String(shopId), []);
      console.error('Error fetching users:', error);
    }
  };


  // Fetch users only once on mount, and only if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    if (users.length === 0) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, isAuthenticated]);

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
        if (data && Array.isArray(data.data)) {
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
  // Removed unused getBalanceColor function

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Balance Management</h1>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
        <strong>Instructions:</strong> View balances for all users. To record or manage payments, use the <b>Payments</b> page.
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{whiteSpace: 'nowrap'}}>Select User:</span>
          <Select
            value={selectedUser ? String(selectedUser.id) : ''}
            onValueChange={val => {
              const user = users.find(u => String(u.id) === String(val));
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
              <span className="font-semibold">Amount Owed: </span>
              <span className="text-lg font-bold text-red-600">₹{Math.abs(selectedUser.balance).toLocaleString()}</span>
              <span className="text-xs text-gray-500 ml-2">(Amount the shop owes this user or is owed by buyer)</span>
            </div>
          </div>
        )}
      </div>
      {selectedUser && (
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
                    <TableHead>Snapshot Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance Type</TableHead>
                    <TableHead>Prev Balance</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>New Balance</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map(s => {
                    let dateStr = '';
                    if (s.createdAt) {
                      const d = new Date(s.createdAt);
                      dateStr = isNaN(d.getTime()) ? '' : d.toLocaleString();
                    }
                    let snapshotDateStr = '';
                    if (s.snapshot_date) {
                      const d = new Date(s.snapshot_date);
                      snapshotDateStr = isNaN(d.getTime()) ? '' : d.toLocaleString();
                    }
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
                        <TableCell>{snapshotDateStr}</TableCell>
                        <TableCell>{s.transaction_type || '-'}</TableCell>
                        <TableCell>{s.balance_type || '-'}</TableCell>
                        <TableCell>₹{prev}</TableCell>
                        <TableCell>₹{change}</TableCell>
                        <TableCell>₹{next}</TableCell>
                        <TableCell>{s.description || '-'}</TableCell>
                        <TableCell>{s.reference_id ? `${s.reference_type || ''} #${s.reference_id}` : '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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