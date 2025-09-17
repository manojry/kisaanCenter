import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { creditAdvanceApi } from '../services/creditAdvanceApi';
import { useUsers } from '../context/UsersContext';

const CreditAdvanceManagement: React.FC = () => {
  const { users: allUsers } = useUsers();
  const users = allUsers.filter((u: any) => ['farmer', 'buyer'].includes(u.role)).map((u: any) => ({ ...u, id: String(u.id) }));
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [credits, setCredits] = useState<any[]>([]);
  // Filter credits by selected user
  const filteredCredits = selectedUser ? credits.filter(c => String(c.user_id) === selectedUser) : credits;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Issue credit form
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [amount, setAmount] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Repay credit form
  const [repayAmount, setRepayAmount] = useState('');
  const [repayCreditId, setRepayCreditId] = useState('');

  const fetchCredits = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await creditAdvanceApi.getAll();
      setCredits(res);
    } catch (err) {
      setError('Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleIssueCredit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        user_id: userId,
        shop_id: shopId,
        amount: parseFloat(amount),
        issued_date: issuedDate,
        due_date: dueDate,
      };
      const res: any = await creditAdvanceApi.issue(payload);
      if (res && (res.success || res.data)) {
        setSuccess('Credit issued successfully');
        fetchCredits();
        setUserId(''); setShopId(''); setAmount(''); setIssuedDate(''); setDueDate('');
      } else {
        setError(res?.error || res?.message || 'Failed to issue credit');
      }
    } catch (err) {
      setError('Failed to issue credit');
    } finally {
      setLoading(false);
    }
  };

  const handleRepayCredit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        credit_id: parseInt(repayCreditId),
        amount: parseFloat(repayAmount),
      };
      const res: any = await creditAdvanceApi.repay(payload);
      if (res && (res.success || res.data)) {
        setSuccess('Repayment successful');
        fetchCredits();
        setRepayCreditId(''); setRepayAmount('');
      } else {
        setError(res?.error || res?.message || 'Failed to repay credit');
      }
    } catch (err) {
      setError('Failed to repay credit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Credit Advance Management</h1>
      <Card>
        <CardHeader>
          <CardTitle style={{whiteSpace: 'nowrap'}}>Select User</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Choose user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Issue Credit Advance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-2">
            <Input placeholder="User ID" value={selectedUser} disabled />
            <Input placeholder="Shop ID" value={shopId} onChange={e => setShopId(e.target.value)} />
            <Input placeholder="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            <Input placeholder="Issued Date (YYYY-MM-DD)" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} />
            <Input placeholder="Due Date (YYYY-MM-DD)" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <Button onClick={handleIssueCredit} disabled={loading || !selectedUser}>Issue</Button>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Repay Credit Advance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-2">
            <Select value={repayCreditId} onValueChange={setRepayCreditId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Credit" />
              </SelectTrigger>
              <SelectContent>
                {filteredCredits.filter(c => c.status === 'active').map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {`Credit #${c.id} - ₹${c.amount}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Amount" type="number" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} />
            <Button onClick={handleRepayCredit} disabled={loading || !repayCreditId || !repayAmount}>Repay</Button>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Credit Advances for Selected User</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div>Loading...</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Repaid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredits.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>₹{c.amount}</TableCell>
                    <TableCell>₹{c.repaid_amount}</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell>{c.issued_date ? String(c.issued_date).slice(0,10) : '-'}</TableCell>
                    <TableCell>{c.due_date ? String(c.due_date).slice(0,10) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditAdvanceManagement;
