import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';



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
              <TableHead>Reason</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell>{exp.user ? exp.user.username : String(exp.user_id)}</TableCell>
                <TableCell>{typeof exp.amount === 'number' ? exp.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ''}</TableCell>
                <TableCell>{exp.reason}</TableCell>
                <TableCell>{exp.description || ''}</TableCell>
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