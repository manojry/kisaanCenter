import { getUserDisplayName } from '../utils/userDisplayName';

import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/formatDate';
import { balanceSnapshotsApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSearchDropdown } from '@/components/ui/UserSearchDropdown';
import { Badge } from '@/components/ui/badge';
import { getRoleBadgeClass } from '@/utils/getRoleBadgeClass';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingDown } from 'lucide-react';
import type { User, BalanceSnapshot as SharedBalanceSnapshot } from '../types/api';
import { useUsers } from '../context/useUsers';

interface BalanceManagementProps {
  shopId: number;
}

const BalanceManagement: React.FC<BalanceManagementProps> = () => {
  const { allUsers, users } = useUsers();
  // Pagination state for User Amounts Owed table
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(allUsers.length / pageSize);
  const pagedUsers = allUsers.slice((page - 1) * pageSize, page * pageSize);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Extend shared BalanceSnapshot type to allow for string id and index signature if needed
  type BalanceSnapshot = Omit<SharedBalanceSnapshot, 'id'> & {
    id: string;
    [key: string]: string | number | undefined;
  };
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);



  // Fetch balance snapshots for selected user
  useEffect(() => {
    if (!selectedUser) {
      setSnapshots([]);
      return;
    }
    setSnapshotsLoading(true);
    balanceSnapshotsApi.getByUserId(selectedUser.id)
  .then((data) => setSnapshots(data.map(s => ({ ...s, id: String(s.id) }))))
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
          <div style={{ minWidth: 220 }}>
            <UserSearchDropdown
              onSelect={user => setSelectedUser(user)}
              placeholder="Search user..."
            />
          </div>
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
                      dateStr = formatDate(s.createdAt);
                    }
                    let snapshotDateStr = '';
                    if (s.snapshot_date) {
                      snapshotDateStr = formatDate(s.snapshot_date);
                    }
                    function safeNumber(val: number | string) {
                      const n = typeof val === 'number' ? val : parseFloat(val as string);
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
                <p className="text-2xl font-bold text-red-600 break-words truncate max-w-[12ch] md:max-w-[20ch] lg:max-w-[28ch]" style={{overflowWrap: 'anywhere'}} title={allUsers.filter(u => u.role === 'farmer' && u.balance > 0).reduce((sum, u) => sum + u.balance, 0).toLocaleString()}>
                  ₹{allUsers.filter(u => u.role === 'farmer' && u.balance > 0).reduce((sum, u) => sum + u.balance, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">(Amount shop owes to farmers)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  {/* Users Table - All balances shown as amount owed */}
  <div className="mb-2 text-sm text-gray-500">Debug: allUsers.length = {allUsers.length}</div>
      <Card>
        <CardHeader>
          <CardTitle>User Amounts Owed</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount Owed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {getUserDisplayName(user)}
                    <Badge variant="outline" className={`ml-2 ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold text-red-600`}>
                      ₹{Math.abs(user.balance).toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination controls: always show page number(s) */}
          <div className="flex justify-end items-center gap-2 mt-4">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              First
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            {/* Numbered page buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                className={`px-3 py-1 border rounded ${pg === page ? 'bg-blue-600 text-white font-bold' : ''}`}
                onClick={() => setPage(pg)}
                disabled={pg === page}
              >
                {pg}
              </button>
            ))}
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              Last
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceManagement;