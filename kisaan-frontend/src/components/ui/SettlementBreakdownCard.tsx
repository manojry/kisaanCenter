import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

interface FifoSettlement {
  expense_id: number;
  amount_settled: number;
  expense_date?: string;
  reason?: string;
}

interface SettlementBreakdown {
  applied_to_expenses: number;
  applied_to_balance: number;
  fifo_result?: {
    settlements?: FifoSettlement[];
    remaining?: number;
  };
}

interface SettlementBreakdownCardProps {
  settlementBreakdown: SettlementBreakdown;
  title?: string;
}

export const SettlementBreakdownCard: React.FC<SettlementBreakdownCardProps> = ({
  settlementBreakdown,
  title = "Payment Settlement Breakdown"
}) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="text-sm text-green-700 font-medium">Applied to Expenses</div>
              <div className="text-2xl font-bold text-green-800">₹{settlementBreakdown.applied_to_expenses.toLocaleString()}</div>
              <div className="text-xs text-green-600">Amount used to settle outstanding expenses</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="text-sm text-blue-700 font-medium">Applied to Balance</div>
              <div className="text-2xl font-bold text-blue-800">₹{settlementBreakdown.applied_to_balance.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Amount applied to reduce balance</div>
            </div>
          </div>
          {settlementBreakdown.fifo_result && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <div className="text-sm text-yellow-700 font-medium mb-2">How Your Payment Was Applied</div>
              <div className="text-xs text-yellow-800">
                {Array.isArray(settlementBreakdown.fifo_result.settlements) && settlementBreakdown.fifo_result.settlements.length > 0 ? (
                  <div className="space-y-2">
                    <div className="font-medium">Oldest expenses paid first:</div>
                    {settlementBreakdown.fifo_result.settlements.map((settlement, index) => (
                      <div key={index} className="bg-white rounded p-2 text-xs">
                        <div><strong>Expense #{settlement.expense_id}</strong></div>
                        <div>Amount: ₹{settlement.amount_settled?.toLocaleString()}</div>
                        <div>Date: {settlement.expense_date ? new Date(settlement.expense_date).toLocaleDateString() : 'N/A'}</div>
                        <div>Reason: {settlement.reason || 'N/A'}</div>
                      </div>
                    ))}
                    {settlementBreakdown.fifo_result.remaining && settlementBreakdown.fifo_result.remaining > 0 && (
                      <div className="bg-blue-50 rounded p-2 text-xs mt-2">
                        <strong>Remaining Amount:</strong> ₹{settlementBreakdown.fifo_result.remaining.toLocaleString()} applied to balance
                      </div>
                    )}
                  </div>
                ) : (
                  <div>No expense settlements in this payment.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface FifoResultDisplayProps {
  fifoResult: {
    settlements?: FifoSettlement[];
    remaining?: number;
  };
  compact?: boolean;
}

export const FifoResultDisplay: React.FC<FifoResultDisplayProps> = ({ fifoResult, compact = false }) => {
  if (!fifoResult.settlements || fifoResult.settlements.length === 0) {
    return <div className="text-sm text-gray-500">No expense settlements</div>;
  }

  return (
    <div className={`space-y-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="font-medium text-gray-700">Expenses Paid (Oldest First):</div>
      {fifoResult.settlements.map((settlement, index) => (
        <div key={index} className="flex justify-between items-center bg-gray-50 rounded px-2 py-1">
          <span>Expense #{settlement.expense_id}</span>
          <Badge variant="outline" className="text-xs">
            ₹{settlement.amount_settled?.toLocaleString()}
          </Badge>
        </div>
      ))}
      {fifoResult.remaining && fifoResult.remaining > 0 && (
        <div className="flex justify-between items-center bg-blue-50 rounded px-2 py-1">
          <span>Balance Adjustment</span>
          <Badge variant="outline" className="text-xs bg-blue-100">
            ₹{fifoResult.remaining.toLocaleString()}
          </Badge>
        </div>
      )}
    </div>
  );
};