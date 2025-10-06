// import React from 'react';

import { useState } from 'react';
import { Badge } from '../components/ui/badge';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate } from '../utils/dateUtils';
import type { Transaction, User } from '../types/api';
import { getUserDisplayNameById } from '../utils/userDisplayName';

interface TransactionCardListProps {
  paginatedTransactions: Transaction[];
  getTransactionStatus: (transaction: Transaction) => string;
  getTransactionStatusColor: (status: string) => string;
  users: User[];
}


export const TransactionCardList: React.FC<TransactionCardListProps> = ({
  paginatedTransactions,
  getTransactionStatus,
  getTransactionStatusColor,
  users,
}) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  return (
    <div className="block sm:hidden space-y-3 w-full">
      {paginatedTransactions.map((transaction, idx) => {
        const derivedStatus = getTransactionStatus(transaction);
        let farmerName = Array.isArray(users) ? getUserDisplayNameById(users, transaction.farmer_id) : '';
        let buyerName = Array.isArray(users) ? getUserDisplayNameById(users, transaction.buyer_id) : '';
        if (!farmerName) farmerName = String(transaction.farmer_id);
        if (!buyerName) buyerName = String(transaction.buyer_id);
        const isExpanded = expandedIdx === idx;
        return (
          <div key={transaction.id + '-' + idx} className="rounded-lg border p-3 bg-white shadow-sm w-full mx-auto break-words">
            <div className="flex justify-between items-center mb-1 gap-2">
              <div className="flex flex-col max-w-[60%]">
                <span className="font-semibold text-xs text-gray-500">Product:</span>
                <span className="font-semibold text-base break-words truncate">{transaction.product_name}</span>
                <span className="font-semibold text-xs text-gray-500 mt-1">Buyer:</span>
                <span className="font-semibold text-base break-words truncate">{buyerName}</span>
                <span className="font-semibold text-xs text-gray-500 mt-1">Seller:</span>
                <span className="font-semibold text-base break-words truncate">{farmerName}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={getTransactionStatusColor(derivedStatus)}>{derivedStatus}</Badge>
                <button
                  className="text-xs text-blue-600 underline mt-1 focus:outline-none"
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                >
                  {isExpanded ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-1 break-words">{formatDisplayDate(transaction.created_at)}</div>
            <div className="flex flex-wrap gap-2 text-xs mb-1">
              <div className="break-words max-w-[48%]"><span className="font-medium">Total:</span> {formatCurrency(transaction.total_amount)}</div>
              <div className="break-words max-w-[48%]"><span className="font-medium">Buyer Paid:</span> {formatCurrency(transaction.buyer_paid)}</div>
              <div className="break-words max-w-[48%]"><span className="font-medium">Buyer Pending:</span> {formatCurrency(transaction.deficit)}</div>
              <div className="break-words max-w-[48%]"><span className="font-medium">Farmer Paid:</span> {formatCurrency(transaction.farmer_paid)}</div>
              <div className="break-words max-w-[48%]"><span className="font-medium">Farmer Pending:</span> {formatCurrency(transaction.farmer_due)}</div>
            </div>
            {isExpanded && (
              <div className="mt-2 border-t pt-2">
                <div className="text-xs font-semibold mb-1">Payments</div>
                {transaction.payments && transaction.payments.length > 0 ? (
                  <ul className="space-y-1">
                    {transaction.payments.map((p, pidx) => {
                      let label = '';
                      if (p.payer_type === 'BUYER' && p.payee_type === 'SHOP') label = 'Paid by Buyer';
                      else if (p.payer_type === 'SHOP' && p.payee_type === 'FARMER') label = 'Paid to Farmer';
                      else if (p.payer_type === 'SHOP' && p.payee_type === 'SHOP') label = 'Commission';
                      else label = `Paid by ${p.payer_type} to ${p.payee_type}`;
                      return (
                        <li key={pidx} className="bg-gray-50 rounded p-2 border text-xs">
                          <div><span className="font-medium">{label}:</span> {formatCurrency(p.amount)}</div>
                          <div><span className="font-medium">Method:</span> {p.method}</div>
                          {p.payment_date && <div><span className="font-medium">Date:</span> {formatDisplayDate(p.payment_date)}</div>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-gray-400 text-xs">No payments</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
