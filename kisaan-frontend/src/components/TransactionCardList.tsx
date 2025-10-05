import React from 'react';
import { Badge } from '../components/ui/badge';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate } from '../utils/dateUtils';
import type { Transaction, User } from '../types/api';

interface TransactionCardListProps {
  paginatedTransactions: Transaction[];
  users: User[];
  getTransactionStatus: (transaction: Transaction) => string;
  getTransactionStatusColor: (status: string) => string;
}

export const TransactionCardList: React.FC<TransactionCardListProps> = ({
  paginatedTransactions,
  users,
  getTransactionStatus,
  getTransactionStatusColor,
}) => (
  <div className="block sm:hidden space-y-3 w-full">
    {paginatedTransactions.map((transaction, idx) => {
      const derivedStatus = getTransactionStatus(transaction);
      return (
        <div key={transaction.id + '-' + idx} className="rounded-lg border p-3 bg-white shadow-sm w-full mx-auto break-words">
          <div className="flex justify-between items-center mb-1 gap-2">
            <span className="font-semibold text-base break-words max-w-[60%] truncate">{transaction.product_name}</span>
            <Badge className={getTransactionStatusColor(derivedStatus)}>{derivedStatus}</Badge>
          </div>
          <div className="text-xs text-gray-500 mb-1 break-words">{formatDisplayDate(transaction.created_at)}</div>
          <div className="flex flex-wrap gap-2 text-xs mb-1">
            <div className="break-words max-w-[48%]"><span className="font-medium">Total:</span> {formatCurrency(transaction.total_amount)}</div>
            <div className="break-words max-w-[48%]"><span className="font-medium">Buyer Paid:</span> {formatCurrency(transaction.buyer_paid)}</div>
            <div className="break-words max-w-[48%]"><span className="font-medium">Buyer Pending:</span> {formatCurrency(transaction.deficit)}</div>
            <div className="break-words max-w-[48%]"><span className="font-medium">Farmer Paid:</span> {formatCurrency(transaction.farmer_paid)}</div>
            <div className="break-words max-w-[48%]"><span className="font-medium">Farmer Pending:</span> {formatCurrency(transaction.farmer_due)}</div>
          </div>
          <div className="text-xs break-words">
            <span className="font-medium">Payments:</span> {transaction.payments && transaction.payments.length > 0 ? (
              <span>
                {(() => {
                  const first = transaction.payments[0];
                  let label = '';
                  if (first.payer_type === 'BUYER' && first.payee_type === 'SHOP') label = 'Paid by Buyer';
                  else if (first.payer_type === 'SHOP' && first.payee_type === 'FARMER') label = 'Paid to Farmer';
                  else if (first.payer_type === 'SHOP' && first.payee_type === 'SHOP') label = 'Commission';
                  else label = `Paid by ${first.payer_type} to ${first.payee_type}`;
                  return (
                    <>
                      {label}: {formatCurrency(first.amount)} ({first.method}{first.payment_date ? `, ${formatDisplayDate(first.payment_date)}` : ''})
                      {transaction.payments.length > 1 && (
                        <span title={transaction.payments.slice(1).map(p => {
                          let l = '';
                          if (p.payer_type === 'BUYER' && p.payee_type === 'SHOP') l = 'Paid by Buyer';
                          else if (p.payer_type === 'SHOP' && p.payee_type === 'FARMER') l = 'Paid to Farmer';
                          else if (p.payer_type === 'SHOP' && p.payee_type === 'SHOP') l = 'Commission';
                          else l = `Paid by ${p.payer_type} to ${p.payee_type}`;
                          return `${l}: ${formatCurrency(p.amount)} (${p.method}${p.payment_date ? `, ${formatDisplayDate(p.payment_date)}` : ''})`;
                        }).join('\n')}>
                          {' '}+{transaction.payments.length - 1} more
                        </span>
                      )}
                    </>
                  );
                })()}
              </span>
            ) : (
              <span className="text-gray-400">No payments</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
