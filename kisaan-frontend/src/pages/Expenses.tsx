// This file has been renamed to Expenses.tsx. Please use Expenses.tsx instead.

import { useState, useEffect, useCallback, useRef } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpensesTable from './components/ExpensesTable';
import ExpenseSummaryDashboard from './components/ExpenseSummaryDashboard';
import { useTransactionStore } from '../store/transactionStore';
import { useUsers } from '../context/useUsers';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { expenseApi } from '../services/api';
import { fetchOwnerShop } from '../utils/shopUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ArrowLeft,
  Receipt
} from 'lucide-react';

import type { Expense, ExpenseUserSummary } from '../types/api';

  // Clean, working Expenses page with Expenses and Summary tabs (settlements removed)

  // SettlementCard and SettlementDialog removed - settlements functionality removed


export default function Expenses() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'summary'>('expenses');

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
  useUsers();
  const { toast } = useToast();
  const { user } = useAuth();
  const storeShop = useTransactionStore(state => state.shop);
  const setStoreShop = useTransactionStore(state => state.setShop);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseForm, setExpenseForm] = useState({
    reason: '',
    userId: '',
    amount: '',
    description: ''
  });
  const [recoverableExpenses, setRecoverableExpenses] = useState<Expense[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseUserSummary[]>([]);
  // Removed unused shopExpenses state
  const [isLoading, setIsLoading] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

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

    // Set storeShop when user changes
    useEffect(() => {
      let cancelled = false;
      const getShop = async () => {
        if (user?.id && user?.shop_id) {
          const shop = await fetchOwnerShop(user.id, user.shop_id);
          if (!cancelled) setStoreShop(shop);
        }
      };
      getShop();
      return () => { cancelled = true; };
    }, [user?.id, user?.shop_id]);

    // Only fetch data when storeShop is set (and not null)
    // Only fetch data for the active tab
    const fetchData = useCallback(async () => {
      if (!user?.id || !storeShop?.id) return;
      setIsLoading(true);
      try {
        if (activeTab === 'expenses') {
          // Expenses (fetch from expense API)
          const expensesRes = await expenseApi.getExpenses(storeShop.id);
          const expensesData = expensesRes?.data || [];
          setExpenses(expensesData);
        } else if (activeTab === 'summary') {
          // Expense summary (fetch detailed breakdown by user)
          const summaryRes = await expenseApi.getExpenseSummary(storeShop.id);
          const summaryData = summaryRes?.data || [];
          setExpenseSummary(summaryData);
          
          // Also fetch pending expenses for the recoverable expenses section
          const expensesRes = await expenseApi.getExpenses(storeShop.id);
          const expensesData = expensesRes?.data || [];
          setRecoverableExpenses(expensesData.filter(exp => exp.status === 'pending'));
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error && typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string' ? (error as { message: string }).message : 'Failed to fetch expenses',
          variant: 'destructive'
        });
  // ...removed log...
      } finally {
        setIsLoading(false);
      }
    }, [user?.id, storeShop?.id, activeTab, toast]);

    useEffect(() => {
      if (!storeShop?.id) return;
      // Only fetch for the active tab and its relevant filters
      if (activeTab === 'expenses' || activeTab === 'summary') {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
          fetchData();
        }, 150); // 150ms debounce
      }
      return () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
    }, [storeShop?.id, activeTab, refreshFlag]);

    // Add Expense
    const handleAddExpense = async () => {
      if (!storeShop?.id || !expenseForm.amount || !expenseForm.description || !expenseForm.userId) {
        // Required fields missing
        return;
      }
      setIsLoading(true);
      try {
        await expenseApi.addExpense({
          shop_id: storeShop.id,
          user_id: Number(expenseForm.userId),
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description
        });
        setExpenseForm({ reason: '', userId: '', amount: '', description: '' });
        setRefreshFlag(f => !f);
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
  // ...removed log...
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
            Manage daily expenses paid to farmers. Use payments to settle outstanding balances.
          </p>
        </div>

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-6">
            <ExpenseSummaryDashboard expenseSummary={expenseSummary} />
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
                  reasons={REASONS}
                  storeShop={storeShop}
                />
              </CardContent>
            </Card>

            {/* List all expenses */}
            <ExpensesTable expenses={expenses} />
          </TabsContent>

          {/* Outstanding Recoverable Expenses */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Outstanding Recoverable Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Only show recoverable expenses if summary tab is active */}
              {activeTab === 'summary' && (
                recoverableExpenses.length === 0 ? (
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
                            {exp.status}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
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