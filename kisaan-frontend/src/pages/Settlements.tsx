// This file has been renamed to Expenses.tsx. Please use Expenses.tsx instead.

// ...existing code...
import React, { useState, useEffect } from 'react';
import type { Shop, Settlement as BaseSettlement, User } from '../types/api';

// Extend Settlement type for frontend-enriched fields
type Settlement = BaseSettlement & {
  user?: User;
  description?: string;
  balance?: number;
};
import { useTransactionStore } from '../store/transactionStore';
import { useUsers } from '../context/UsersContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { fetchOwnerShop } from '../utils/shopUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- User Amounts Owed Table with Pagination ---
interface UserAmountsOwedTableProps {
  summary: any[];
  recoverableExpenses: any[];
}

const UserAmountsOwedTable: React.FC<UserAmountsOwedTableProps> = ({ summary, recoverableExpenses }) => {
  const [page, setPage] = React.useState(1);
  const pageSize = 8;
  const totalPages = Math.ceil(summary.length / pageSize);
  const paged = summary.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Pending</TableHead>
            <TableHead>Outstanding Expenses</TableHead>
            <TableHead className="text-right">Amount Owed</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((item, idx) => {
            const userExpenses = recoverableExpenses.filter((exp: any) => exp.user_id === item.user_id);
            const totalRecoverable = userExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
            const totalBalance = typeof item === 'object' && 'total_balance' in item ? (item as { total_balance: number }).total_balance : 0;
            return (
              <TableRow key={item.user_id || idx}>
                <TableCell>{typeof item === 'object' && 'username' in item ? (item as { username: string }).username : ''}</TableCell>
                <TableCell className="capitalize">{typeof item === 'object' && 'user_type' in item ? (item as { user_type: string }).user_type : ''}</TableCell>
                <TableCell>{typeof item === 'object' && 'pending_count' in item ? (item as { pending_count: number }).pending_count : ''}</TableCell>
                <TableCell>{totalRecoverable > 0 ? formatCurrency(totalRecoverable) : '-'}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totalBalance)}</TableCell>
                <TableCell>
                  <Badge variant={totalBalance > 0 ? 'destructive' : 'default'}>
                    {totalBalance > 0 ? 'Owes Shop' : 'Shop Owes'}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink isActive={page === i + 1} onClick={() => handlePageChange(i + 1)}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => handlePageChange(page + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../components/ui/pagination';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft,
  Receipt,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/formatters';

export default function Expenses() {
  const REASONS = [
    { value: 'food', label: 'Food' },
    { value: 'tea', label: 'Tea' },
    { value: 'transport', label: 'Transport' },
    { value: 'advance', label: 'Advance' }
  ];
  const [expenseReason, setExpenseReason] = useState('');
  const transactionStore = useTransactionStore();
  const [expenseUserId, setExpenseUserId] = useState('');
  const { users, isLoading: usersLoading } = useUsers();
  const { toast } = useToast();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [summary, setSummary] = useState<Settlement[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [recoverableExpenses, setRecoverableExpenses] = useState<Settlement[]>([]);
  const [shopExpenses, setShopExpenses] = useState<Settlement[]>([]);
  const [netEarnings, setNetEarnings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [settleAmount, setSettleAmount] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  // Filters
  const [filterUser] = useState('');
  const [filterStatus] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  // FIFO Repayment
  const [fifoAmount, setFifoAmount] = useState('');
  const [fifoUserId, setFifoUserId] = useState('');
  // Fetch shop users when shop changes
  React.useEffect(() => {
    if (shop?.id) {
      let users = transactionStore.getUsers(String(shop.id));
      if (!users || users.length === 0) {
        (async () => {
          try {
            const usersRes = await apiClient.get<{ users: User[] }>(`/shops/${shop.id}/users`);
            users = usersRes?.users || [];
            transactionStore.setUsers(String(shop.id), users);
          } catch {
            transactionStore.setUsers(String(shop.id), []);
          }
        })();
      }
    }
  }, [shop]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Prefer direct fetch by shop_id if available
      const firstShop = await fetchOwnerShop(user.id, user.shop_id);
      setShop(firstShop);
      if (firstShop?.id) {
        // Build filter params
        const params: Record<string, string | number> = { shop_id: firstShop.id };
        if (filterUser) params.user_id = filterUser;
        if (filterStatus) params.status = filterStatus;
        if (filterFromDate) params.from_date = filterFromDate;
        if (filterToDate) params.to_date = filterToDate;
        // Build query string for settlements endpoint
        const queryString = Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
        const [summaryRes, settlementsRes, recoverableRes, shopExpRes] = await Promise.all([
          apiClient.get(`/settlements/summary?shop_id=${firstShop.id}`),
          apiClient.get(`/settlements?${queryString}`),
          apiClient.get(`/settlements?shop_id=${firstShop.id}&reason=expense&status=pending`),
          apiClient.get(`/settlements?shop_id=${firstShop.id}&user_id=shop&reason=expense`)
        ]);
        let summaryData: Settlement[] = [];
        if (summaryRes && typeof summaryRes === 'object' && 'data' in summaryRes) {
          summaryData = summaryRes.data as Settlement[];
        } else if (Array.isArray(summaryRes)) {
          summaryData = summaryRes as Settlement[];
        }

        let settlementsData: Settlement[] = [];
        if (settlementsRes && typeof settlementsRes === 'object' && 'data' in settlementsRes) {
          settlementsData = settlementsRes.data as Settlement[];
        } else if (Array.isArray(settlementsRes)) {
          settlementsData = settlementsRes as Settlement[];
        }

        let recoverableData: Settlement[] = [];
        if (recoverableRes && typeof recoverableRes === 'object' && 'data' in recoverableRes) {
          recoverableData = recoverableRes.data as Settlement[];
        } else if (Array.isArray(recoverableRes)) {
          recoverableData = recoverableRes as Settlement[];
        }

        let shopExpData: Settlement[] = [];
        if (shopExpRes && typeof shopExpRes === 'object' && 'data' in shopExpRes) {
          shopExpData = shopExpRes.data as Settlement[];
        } else if (Array.isArray(shopExpRes)) {
          shopExpData = shopExpRes as Settlement[];
        }

        setSummary(summaryData);
        setSettlements(settlementsData);
        setRecoverableExpenses(recoverableData);
        setShopExpenses(shopExpData);
        // Calculate net earnings: commission - shop expenses
  const totalCommission = Array.isArray(summaryData) ? summaryData.reduce((sum: number, item: Settlement & { total_commission?: number }) => sum + (item.total_commission || 0), 0) : 0;
  const totalShopExpenses = Array.isArray(shopExpData) ? shopExpData.reduce((sum: number, exp: Settlement) => sum + (exp.amount || 0), 0) : 0;
        setNetEarnings((totalCommission || 0) - (totalShopExpenses || 0));
      }
  } catch (error: unknown) {
      toast({
        title: 'Error',
  description: (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: string }).message === 'string') ? (error as { message?: string }).message! : 'Failed to fetch settlement data',
        variant: 'destructive',
      });
      console.error('Failed to fetch settlement data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleFifoRepay = async () => {
    if (!shop?.id || !fifoUserId || !fifoAmount) return;
    try {
      await apiClient.post('/settlements/repay-fifo', {
        shop_id: shop.id,
        user_id: fifoUserId,
        amount: parseFloat(fifoAmount)
      });
      setFifoAmount('');
      setFifoUserId('');
      fetchData();
  } catch (error: unknown) {
      toast({
        title: 'Error',
  description: (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: string }).message === 'string') ? (error as { message?: string }).message! : 'Failed FIFO repayment',
        variant: 'destructive',
      });
      console.error('Failed FIFO repayment:', error);
    }
  };

  const handleSettle = async () => {
    if (!selectedSettlement || !settleAmount) return;
    
    try {
      await apiClient.post(`/settlements/settle/${selectedSettlement.id}`, {
        amount: parseFloat(settleAmount)
      });
      setSettleAmount('');
      setSelectedSettlement(null);
      fetchData();
  } catch (error: unknown) {
      toast({
        title: 'Error',
  description: (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: string }).message === 'string') ? (error as { message?: string }).message! : 'Settlement failed',
        variant: 'destructive',
      });
      console.error('Settlement failed:', error);
    }
  };

  const handleAddExpense = async () => {
  if (!shop?.id || !expenseAmount || !expenseDescription || !expenseUserId) return;
    
    try {
      await apiClient.post('/settlements/expense', {
        shop_id: shop.id,
        user_id: expenseUserId,
        amount: parseFloat(expenseAmount),
        reason: expenseReason,
        description: expenseDescription
      });
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseUserId('');
      setExpenseReason('');
      fetchData();
  } catch (error: unknown) {
      toast({
        title: 'Error',
  description: (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: string }).message === 'string') ? (error as { message?: string }).message! : 'Failed to add expense',
        variant: 'destructive',
      });
      console.error('Failed to add expense:', error);
    }
  };

  if (!user || user.role !== 'owner') {
    toast({
      title: "Access Denied",
      description: "Owner role required.",
      variant: "destructive",
    });
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Owner role required to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm" className="md:hidden">
            <Link to="/owner">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Expenses</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Manage overpayments, credits, and daily expenses for {shop?.name || 'your shop'}
        </p>
      </div>

  <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Outstanding Balances</h2>
            {summary.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No outstanding settlements</p>
                </CardContent>
              </Card>
            ) : (
              <UserAmountsOwedTable summary={summary} recoverableExpenses={recoverableExpenses} />
            )}


            {/* Shop expenses and net earnings summary */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Shop Expenses & Net Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div><strong>Total Shop Expenses:</strong> {formatCurrency(shopExpenses.reduce((sum: number, exp: Settlement) => sum + (exp.amount || 0), 0))}</div>
                  <div><strong>Net Earnings (Commission - Expenses):</strong> {formatCurrency(netEarnings)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settlements" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">All Settlements</h2>
            {/* Filter controls */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} placeholder="From date" />
              <Input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} placeholder="To date" />
              <Button size="sm" onClick={fetchData}>Filter Income</Button>
              <Button size="sm" onClick={fetchData} aria-label="Apply filters">Filter Income</Button>
            </div>
            {/* FIFO Repayment Form */}
            <Card className="mb-4">
              <CardHeader><CardTitle>FIFO Repayment</CardTitle></CardHeader>
              <CardContent className="flex gap-2 items-end">
                <Input type="text" value={fifoUserId} onChange={e => setFifoUserId(e.target.value)} placeholder="User ID" />
                <Input type="number" value={fifoAmount} onChange={e => setFifoAmount(e.target.value)} placeholder="Amount" />
                <Button size="sm" onClick={handleFifoRepay}>Repay</Button>
                <Button size="sm" onClick={handleFifoRepay} aria-label="Repay FIFO" disabled={!fifoUserId || !fifoAmount || isLoading}>Repay</Button>
              </CardContent>
            </Card>
            {settlements.map((settlement) => (
              <Card key={settlement.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{settlement.user?.username || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {settlement.description}
                      </p>
                    </div>
                    <Badge variant={settlement.status === 'settled' ? 'default' : 'secondary'}>
                      {settlement.status === 'settled' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {settlement.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span>Amount: {formatCurrency(settlement.amount)}</span>
                      {typeof settlement === 'object' && 'settled_amount' in settlement && (settlement as { settled_amount?: number }).settled_amount! > 0 && (
                        <span className="ml-2 text-green-600">
                          (Settled: {formatCurrency((settlement as { settled_amount?: number }).settled_amount ?? 0)})
                        </span>
                      )}
                    </div>
                    
                    {settlement.status === 'pending' && (settlement.balance ?? 0) > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedSettlement(settlement)}
                      >
                        Settle
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Daily Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="expenseReason">Reason</Label>
                <select
                  id="expenseReason"
                  value={expenseReason}
                  onChange={e => setExpenseReason(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={isLoading}
                >
                  <option value="">Select reason</option>
                  {REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="expenseUser">User</Label>
                <select
                  id="expenseUser"
                  value={expenseUserId}
                  onChange={e => setExpenseUserId(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  disabled={isLoading || usersLoading || users.length === 0}
                >
                  {usersLoading || users.length === 0 ? (
                    <option value="">Loading users...</option>
                  ) : (
                    <>
                      <option value="">Select user</option>
                      {users.map((u: User) => (
                        <option key={u.id} value={u.id}>{u.username || (typeof u === 'object' && 'name' in u ? (u as { name: string }).name : '') || u.id}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="expenseAmount">Amount</Label>
                <Input
                  id="expenseAmount"
                  type="number"
                  placeholder="Enter expense amount"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expenseDescription">Description</Label>
                <Input
                  id="expenseDescription"
                  placeholder="Enter expense description"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleAddExpense} aria-label="Add Expense" disabled={!expenseAmount || !expenseDescription || !expenseUserId || !expenseReason || isLoading}>Add Expense</Button>
            </CardContent>
          </Card>
          {/* List recoverable expenses and allow marking as recovered */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Outstanding Recoverable Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {recoverableExpenses.length === 0 ? (
                <div>No outstanding recoverable expenses.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recoverableExpenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{exp.user?.username || exp.user_id}</TableCell>
                        <TableCell>{formatCurrency(exp.amount)}</TableCell>
                        <TableCell>{exp.description || exp.reason}</TableCell>
                        <TableCell>{exp.status}</TableCell>
                        <TableCell>
                          {exp.status === 'pending' && (
                            <Button size="sm" onClick={async () => {
                              await apiClient.put(`/settlements/${exp.id}`, { status: 'settled' });
                              fetchData();
                            }}>Mark as Recovered</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settlement Dialog */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Settle Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedSettlement.user?.username} - {selectedSettlement.description}
                </p>
                <p className="font-semibold">
                  Outstanding: {formatCurrency(selectedSettlement.balance ?? 0)}
                </p>
              </div>
              <div>
                <Label htmlFor="settleAmount">Settlement Amount</Label>
                <Input
                  id="settleAmount"
                  type="number"
                  placeholder="Enter amount received"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSettle}>Settle</Button>
                <Button onClick={handleSettle} aria-label="Settle" disabled={!settleAmount || isLoading}>Settle</Button>
                <Button variant="outline" onClick={() => setSelectedSettlement(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      )}
    </div>
  );
}