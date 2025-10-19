import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';



import type { Expense } from '../../types/api';

interface ExpensesTableProps {
  expenses: Expense[];
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses }) => (
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
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell>{exp.user ? exp.user.username : String(exp.user_id)}</TableCell>
                <TableCell>{typeof exp.amount === 'number' ? exp.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ''}</TableCell>
                <TableCell>{exp.type || 'expense'}</TableCell>
                <TableCell>{exp.description || ''}</TableCell>
                <TableCell>
                  <Badge variant={exp.status === 'settled' ? 'default' : 'secondary'} className={exp.status === 'settled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {exp.status === 'settled' ? 'Settled' : 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>{exp.date ? new Date(exp.date).toLocaleDateString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export default ExpensesTable;