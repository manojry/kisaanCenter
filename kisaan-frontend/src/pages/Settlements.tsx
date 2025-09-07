import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  ArrowLeft,
  AlertCircle,
  Users,
  DollarSign,
  Receipt,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/formatters';

export default function Settlements() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [summary, setSummary] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settleAmount, setSettleAmount] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const shopRes = await apiClient.get(`/shops?owner_id=${user.id}`);
      const userShop = shopRes?.shops?.[0];
      setShop(userShop);
      
      if (userShop?.id) {
        const [summaryRes, settlementsRes] = await Promise.all([
          apiClient.get(`/settlements/summary?shop_id=${userShop.id}`),
          apiClient.get(`/settlements?shop_id=${userShop.id}`)
        ]);
        
        setSummary(summaryRes?.data || []);
        setSettlements(settlementsRes?.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch settlement data:', error);
    } finally {
      setIsLoading(false);
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
    } catch (error) {
      console.error('Settlement failed:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!shop?.id || !expenseAmount || !expenseDescription) return;
    
    try {
      await apiClient.post('/settlements/expense', {
        shop_id: shop.id,
        amount: parseFloat(expenseAmount),
        description: expenseDescription
      });
      
      setExpenseAmount('');
      setExpenseDescription('');
      fetchData();
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  if (!user || user.role !== 'owner') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Access denied. Owner role required.</AlertDescription>
      </Alert>
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
            <h1 className="text-2xl md:text-3xl font-bold">Settlements</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Manage overpayments, credits, and daily expenses for {shop?.name || 'your shop'}
        </p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="settlements">All Settlements</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
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
              summary.map((item: any) => (
                <Card key={`${item.user_type}_${item.user_id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{item.username}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.user_type} • {item.pending_count} pending
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(item.total_balance)}
                        </div>
                        <Badge variant={item.total_balance > 0 ? "destructive" : "default"}>
                          {item.total_balance > 0 ? "Owes Shop" : "Shop Owes"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settlements" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">All Settlements</h2>
            {settlements.map((settlement: any) => (
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
                      {settlement.settled_amount > 0 && (
                        <span className="ml-2 text-green-600">
                          (Settled: {formatCurrency(settlement.settled_amount)})
                        </span>
                      )}
                    </div>
                    
                    {settlement.status === 'pending' && settlement.balance > 0 && (
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
              <Button onClick={handleAddExpense}>Add Expense</Button>
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
                  Outstanding: {formatCurrency(selectedSettlement.balance)}
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
                <Button variant="outline" onClick={() => setSelectedSettlement(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}