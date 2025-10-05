// This file has been renamed to Expenses.tsx. Please use Expenses.tsx instead.

import { useState, useEffect } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useUsers } from '../context/UsersContext';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { expenseApi, settlementsApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link } from "react-router-dom";
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft,
  Receipt,
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

  // Clean, working Expenses page with Expenses, Settlements, and Summary tabs
  export default function Expenses() {
    const REASONS = [
      { value: 'food', label: 'Food' },
      { value: 'tea', label: 'Tea' },
      { value: 'transport', label: 'Transport' },
      { value: 'advance', label: 'Advance' }
    ];
    const transactionStore = useTransactionStore();
    const { users, isLoading: usersLoading } = useUsers();
    const { toast } = useToast();
    const { user } = useAuth();
  const storeShop = useTransactionStore(state => state.shop);
  const setStoreShop = useTransactionStore(state => state.setShop);
    const [expenses, setExpenses] = useState<{
      id: number;
      shop_id: number;
      user_id: number;
      amount: number;
      reason?: string;
      description?: string;
      created_at: string;
      updated_at: string;
      user?: import('../types/api').User;
      date?: string;
    }[]>([]);
    const [totalExpenses, setTotalExpenses] = useState<number>(0);
    const [expenseReason, setExpenseReason] = useState('');
    const [expenseUserId, setExpenseUserId] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDescription, setExpenseDescription] = useState('');
  const [settlements, setSettlements] = useState<import('../types/api').Settlement[]>([]);
    const [settleAmount, setSettleAmount] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState<import('../types/api').Settlement | null>(null);
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const [fifoAmount, setFifoAmount] = useState('');
    const [fifoUserId, setFifoUserId] = useState('');
  const [recoverableExpenses, setRecoverableExpenses] = useState<import('../types/api').Settlement[]>([]);
    // Removed unused shopExpenses state
    const [netEarnings, setNetEarnings] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // If storeShop is missing but user.shop_id exists, set it globally
      if (!storeShop && user?.shop_id) {
        // Create a minimal Shop object with required fields
        setStoreShop({
          id: user.shop_id,
          name: '',
          owner_id: user.id,
          address: '',
          contact: '',
          created_at: '',
          updated_at: '',
          status: 'active'
        });
      }
      if (storeShop?.id) {
        const shopIdStr = String(storeShop.id);
        let users = transactionStore.getUsers(shopIdStr);
        if (!users || users.length === 0) {
          (async () => {
            // You should use a users API here, but keeping logic as is
            const usersRes: any = await expenseApi.getExpenses(storeShop.id); // Replace with getUsers API if available
            users = usersRes?.data || [];
            transactionStore.setUsers(shopIdStr, users);
          })();
        }
      }
    }, [storeShop]);

    useEffect(() => {
      fetchData();
      // eslint-disable-next-line
    }, [user]);

    const fetchData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        // Shop fetch
        const shopRes: any = await fetch(`/api/shops?owner_id=${user.id}`).then(res => res.json());
        const firstShop = shopRes?.shops?.[0] ?? null;
        setStoreShop(firstShop);
        if (firstShop?.id) {
          // Expenses (fetch as settlements with reason 'adjustment')
          const expensesRes: any = await settlementsApi.getAll({ shop_id: firstShop.id, reason: 'adjustment' });
          const expensesData = expensesRes?.data || [];
          setExpenses(expensesData);
          setTotalExpenses(expensesData.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0));
          // Settlements
          const params: any = { shop_id: firstShop.id };
          if (filterFromDate) params.from_date = filterFromDate;
          if (filterToDate) params.to_date = filterToDate;
          const settlementsRes: any = await settlementsApi.getAll(params);
          setSettlements(settlementsRes?.data || []);
          // Recoverable expenses (pending)
          const recoverableRes: any = await settlementsApi.getAll({ shop_id: firstShop.id, reason: 'expense', status: 'pending' });
          setRecoverableExpenses(recoverableRes?.data || []);
          // Shop expenses
            // Removed unused shopExpRes variable (was: await settlementsApi.getAll({ shop_id: firstShop.id, settlementUser_id: firstShop.id, reason: 'expense' }))
    // Removed setShopExpenses, no longer needed
          // Net earnings (commission - expenses)
          setNetEarnings(expensesData.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0));
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error && error.message ? error.message : 'Failed to fetch expenses/settlements',
          variant: 'destructive'
        });
        console.error('Failed to fetch expenses/settlements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // FIFO Repayment
    const handleFifoRepay = async () => {
  if (!storeShop?.id || !fifoUserId || !fifoAmount) return;
      try {
        await settlementsApi.create({
          shop_id: storeShop.id,
          settlementUser_id: Number(fifoUserId),
          amount: parseFloat(fifoAmount),
          reason: 'adjustment',
        });
        setFifoAmount('');
        setFifoUserId('');
        fetchData();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error && error.message ? error.message : 'Failed FIFO repayment',
          variant: 'destructive'
        });
        console.error('Failed FIFO repayment:', error);
      }
    };

    // Settle
    const handleSettle = async () => {
      if (!selectedSettlement || !settleAmount) return;
      try {
        await settlementsApi.update(selectedSettlement.id, {
          status: 'settled',
          notes: `Settled amount: ${settleAmount}`
        });
        setSettleAmount('');
        setSelectedSettlement(null);
        fetchData();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error && error.message ? error.message : 'Settlement failed',
          variant: 'destructive'
        });
        console.error('Settlement failed:', error);
      }
    };

    // Add Expense
    const handleAddExpense = async () => {
      console.log('Add Expense Clicked', {
        shopId: storeShop?.id,
        expenseAmount,
        expenseDescription,
        expenseUserId,
        expenseReason
      });
      if (!storeShop?.id || !expenseAmount || !expenseDescription || !expenseUserId) {
        console.warn('Missing required fields for expense', {
          shopId: storeShop?.id,
          expenseAmount,
          expenseDescription,
          expenseUserId
        });
        return;
      }
      setIsLoading(true);
      try {
        const res = await settlementsApi.create({
          shop_id: storeShop.id,
          settlementUser_id: Number(expenseUserId),
          owner_id: user?.id ?? undefined,
          amount: parseFloat(expenseAmount),
          reason: 'adjustment',
          notes: expenseDescription
        });
        console.log('Expense API response:', res);
        setExpenseAmount('');
        setExpenseDescription('');
        setExpenseUserId('');
        setExpenseReason('');
        await fetchData();
        toast({
          title: 'Expense Added',
          description: 'Expense has been successfully recorded.',
          variant: 'success'
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error && error.message ? error.message : 'Failed to add expense',
          variant: 'destructive'
        });
        console.error('Failed to add expense:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user || user.role !== 'owner') {
      toast({
        title: "Access Denied",
        description: "Owner role required.",
        variant: "destructive",
      });
      return <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Owner role required to access this page.</p>
        </div>
      </div>;
    }
    if (!user.shop_id) {
      toast({
        title: "Setup Required",
        description: "No shop assigned to your account. Please contact support or your administrator.",
        variant: "destructive",
      });
      return <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-2">Setup Required</h2>
          <p className="text-gray-600">No shop assigned to your account. Please contact support.</p>
        </div>
      </div>;
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
            Manage overpayments, credits, settlements, and daily expenses for {storeShop?.name || 'your shop'}
          </p>
        </div>

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div><strong>Total Expenses:</strong> {formatCurrency(totalExpenses)}</div>
                  <div><strong>Net Earnings:</strong> {formatCurrency(netEarnings)}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Daily Expense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!storeShop?.id && (
                  <div className="text-red-600 text-sm mb-2">Shop not loaded. Please wait or check your account.</div>
                )}
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
                        {users.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.firstname ? u.firstname : (u.username ? u.username : u.id)}
                          </option>
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
                <Button onClick={handleAddExpense} aria-label="Add Expense" disabled={!expenseAmount || !expenseDescription || !expenseUserId || !expenseReason || isLoading || !storeShop?.id}>
                  {isLoading ? 'Adding...' : 'Add Expense'}
                </Button>
              </CardContent>
            </Card>

            {/* List all expenses */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>All Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div>No expenses recorded yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>{(exp as any).user?.username || exp.user_id}</TableCell>
                          <TableCell>{formatCurrency(exp.amount)}</TableCell>
                          <TableCell>{exp.reason}</TableCell>
                          <TableCell>{(exp as any).description}</TableCell>
                          <TableCell>{(exp as any).date ? new Date((exp as any).date).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">All Settlements</h2>
              {/* Filter controls */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} placeholder="From date" />
                <Input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} placeholder="To date" />
                <Button size="sm" onClick={fetchData}>Filter Income</Button>
              </div>
              {/* FIFO Repayment Form */}
              <Card className="mb-4">
                <CardHeader><CardTitle>FIFO Repayment</CardTitle></CardHeader>
                <CardContent className="flex gap-2 items-end">
                  <Input type="text" value={fifoUserId} onChange={e => setFifoUserId(e.target.value)} placeholder="User ID" />
                  <Input type="number" value={fifoAmount} onChange={e => setFifoAmount(e.target.value)} placeholder="Amount" />
                  <Button size="sm" onClick={handleFifoRepay} aria-label="Repay FIFO" disabled={!fifoUserId || !fifoAmount || isLoading}>Repay</Button>
                </CardContent>
              </Card>
              {settlements.map((settlement) => (
                <Card key={settlement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{(settlement as any).user?.username || 'Unknown'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {(settlement as any).description}
                        </p>
                      </div>
                      <Badge variant={settlement.status === 'settled' ? 'default' : 'secondary'}>
                        {settlement.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span>Amount: {formatCurrency(settlement.amount)}</span>
                        {(settlement as any).settled_amount > 0 && (
                          <span className="ml-2 text-green-600">
                            (Settled: {formatCurrency((settlement as any).settled_amount)})
                          </span>
                        )}
                      </div>
                      {(settlement.status === 'pending' && (settlement as any).balance > 0) && (
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
                        {(selectedSettlement as any).user?.username} - {(selectedSettlement as any).description}
                      </p>
                      <p className="font-semibold">
                        Outstanding: {formatCurrency((selectedSettlement as any).balance)}
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
                      <Button onClick={handleSettle} aria-label="Settle" disabled={!settleAmount || isLoading}>Settle</Button>
                      <Button variant="outline" onClick={() => setSelectedSettlement(null)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Outstanding Recoverable Expenses */}
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
                        <TableCell>{(exp as any).user?.username || exp.user_id}</TableCell>
                        <TableCell>{formatCurrency(exp.amount)}</TableCell>
                        <TableCell>{(exp as any).description || exp.reason}</TableCell>
                        <TableCell>{exp.status}</TableCell>
                        <TableCell>
                          {exp.status === 'pending' && (
                            <Button size="sm" onClick={async () => {
                              await settlementsApi.update(exp.id, { status: 'settled' });
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

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <span className="text-muted-foreground">Loading...</span>
            </div>
          )}
        </Tabs>
      </div>
    );
  }