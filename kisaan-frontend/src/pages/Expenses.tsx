// This file has been renamed to Expenses.tsx. Please use Expenses.tsx instead.

import { useState, useEffect } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpensesTable from './components/ExpensesTable';
import ExpenseSummaryCard from './components/ExpenseSummaryCard';
import SettlementsTab from './components/SettlementsTab';
import { useTransactionStore } from '../store/transactionStore';
import { useUsers } from '../context/UsersContext';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { expenseApi, settlementsApi } from '../services/api';
import { fetchOwnerShop } from '../utils/shopUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ArrowLeft,
  Receipt,
} from 'lucide-react';

import type { Settlement, User } from '../types/api';

  // Clean, working Expenses page with Expenses, Settlements, and Summary tabs

  // SettlementCard and SettlementDialog are now imported from ./components


export default function Expenses() {
  const [settlements, setSettlements] = useState<import('../types/api').Settlement[]>([]);
  // Compute summary: group settlements by user_id and sum their amounts as total_balance

  // ...existing code...

  // Example usage: render UserAmountsOwedTable with summary and recoverableExpenses
  // <UserAmountsOwedTable summary={summary} recoverableExpenses={recoverableExpenses} />
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
  type Expense = Settlement & { user?: User; date?: string };
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [expenseForm, setExpenseForm] = useState({
    reason: '',
    userId: '',
    amount: '',
    description: ''
  });
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
            const usersRes: unknown = await expenseApi.getExpenses(storeShop.id); // Replace with getUsers API if available
            if (usersRes && typeof usersRes === 'object' && 'data' in usersRes && Array.isArray((usersRes as { data?: unknown[] }).data)) {
              users = (usersRes as { data?: import('../types/api').User[] }).data || [];
            } else {
              users = [];
            }
            transactionStore.setUsers(shopIdStr, users);
          })();
        }
      }
    }, [storeShop]);

    useEffect(() => {
      fetchData();
    }, [user]);

    const fetchData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        // Prefer direct fetch by shop_id if available
        const firstShop = await fetchOwnerShop(user.id, user.shop_id);
        setStoreShop(firstShop);
        if (firstShop?.id) {
          // Expenses (fetch as settlements with reason 'adjustment')
          const expensesRes = await settlementsApi.getAll({ shop_id: firstShop.id, reason: 'adjustment' });
          const expensesData = expensesRes?.data || [];
          setExpenses(expensesData);
          setTotalExpenses(expensesData.reduce((sum: number, exp: { amount?: number }) => sum + (exp.amount || 0), 0));
          // Settlements
          const params: Record<string, unknown> = { shop_id: firstShop.id };
          if (filterFromDate) params.from_date = filterFromDate;
          if (filterToDate) params.to_date = filterToDate;
          const settlementsRes = await settlementsApi.getAll(params);
          setSettlements(settlementsRes?.data || []);
          // Recoverable expenses (pending)
          const recoverableRes = await settlementsApi.getAll({ shop_id: firstShop.id, reason: 'expense', status: 'pending' });
          setRecoverableExpenses(recoverableRes?.data || []);
          // Net earnings (commission - expenses)
          setNetEarnings(expensesData.reduce((sum: number, exp: { amount?: number }) => sum + (exp.amount || 0), 0));
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error && typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string' ? (error as { message: string }).message : 'Failed to fetch expenses/settlements',
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
      } catch (error) {
        toast({
          title: 'Error',
          description: error && typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string' ? (error as { message: string }).message : 'Failed FIFO repayment',
          variant: 'destructive'
        });
        console.error('Failed FIFO repayment:', error);
      }
    };

    // Settle
    const handleSettle = async () => {
      if (!selectedSettlement || !settleAmount) return;
      try {
        await settlementsApi.settle(selectedSettlement.id, {
          amount: parseFloat(settleAmount),
          notes: `Settled amount: ${settleAmount}`
        });
        setSettleAmount('');
        setSelectedSettlement(null);
        fetchData();
      } catch (error) {
        toast({
          title: 'Error',
          description: error && typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string' ? (error as { message: string }).message : 'Settlement failed',
          variant: 'destructive'
        });
        console.error('Settlement failed:', error);
      }
    };

    // Add Expense
    const handleAddExpense = async () => {
      console.log('Add Expense Clicked', {
        shopId: storeShop?.id,
        ...expenseForm
      });
      if (!storeShop?.id || !expenseForm.amount || !expenseForm.description || !expenseForm.userId) {
        console.warn('Missing required fields for expense', {
          shopId: storeShop?.id,
          ...expenseForm
        });
        return;
      }
      setIsLoading(true);
      try {
        const res = await settlementsApi.create({
          shop_id: storeShop.id,
          settlementUser_id: Number(expenseForm.userId),
          owner_id: user?.id ?? undefined,
          amount: parseFloat(expenseForm.amount),
          reason: 'adjustment',
          notes: expenseForm.description
        });
        console.log('Expense API response:', res);
        setExpenseForm({ reason: '', userId: '', amount: '', description: '' });
        await fetchData();
        toast({
          title: 'Expense Added',
          description: 'Expense has been successfully recorded.',
          variant: 'success'
        });
      } catch (error) {
        const errMsg = error && typeof error === 'object' && 'message' in error ? (error as { message?: string }).message : 'Failed to add expense';
        toast({
          title: 'Error',
          description: errMsg,
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
            <ExpenseSummaryCard totalExpenses={totalExpenses} netEarnings={netEarnings} />
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
                <ExpenseForm
                  expenseForm={expenseForm}
                  setExpenseForm={setExpenseForm}
                  handleAddExpense={handleAddExpense}
                  isLoading={isLoading}
                  users={users}
                  usersLoading={usersLoading}
                  reasons={REASONS}
                  storeShop={storeShop}
                />
              </CardContent>
            </Card>

            {/* List all expenses */}
            <ExpensesTable expenses={expenses} />
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="mt-6">
            <SettlementsTab
              filterFromDate={filterFromDate}
              setFilterFromDate={setFilterFromDate}
              filterToDate={filterToDate}
              setFilterToDate={setFilterToDate}
              fetchData={fetchData}
              fifoUserId={fifoUserId}
              setFifoUserId={setFifoUserId}
              fifoAmount={fifoAmount}
              setFifoAmount={setFifoAmount}
              handleFifoRepay={handleFifoRepay}
              settlements={settlements}
              setSelectedSettlement={setSelectedSettlement}
              selectedSettlement={selectedSettlement}
              settleAmount={settleAmount}
              setSettleAmount={setSettleAmount}
              handleSettle={handleSettle}
              isLoading={isLoading}
            />
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
                      <TableCell>User</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Pending</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell className="text-right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recoverableExpenses.map((exp, idx) => (
                      <TableRow key={exp.id || idx}>
                        <TableCell>{'username' in exp && typeof exp.username === 'string' ? exp.username : ''}</TableCell>
                        <TableCell className="capitalize">{'user_type' in exp && typeof exp.user_type === 'string' ? exp.user_type : ''}</TableCell>
                        <TableCell>{'pending_count' in exp && typeof exp.pending_count === 'number' ? exp.pending_count : ''}</TableCell>
                        <TableCell>{exp.amount}</TableCell>
                        <TableCell className="text-right font-semibold"></TableCell>
                        <TableCell>{exp.status}</TableCell>
                        <TableCell>
                          {exp.status === 'pending' && (
                            <Button size="sm" onClick={async () => {
                              await settlementsApi.settle(exp.id);
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