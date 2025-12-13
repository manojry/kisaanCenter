import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react';
import { fetchLedgerSummary } from './api';

interface SummaryData {
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
}

const LedgerSummary: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData>({
    totalCredit: 0,
    totalDebit: 0,
    netBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLedgerSummary(1);
        setSummary({
          totalCredit: data.totalCredit || 0,
          totalDebit: data.totalDebit || 0,
          netBalance: data.netBalance || 0
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch summary');
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading summary...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 flex items-center gap-3 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Credit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Total Credit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">₹{summary.totalCredit.toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-1">Amount received</p>
        </CardContent>
      </Card>

      {/* Total Debit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            Total Debit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">₹{summary.totalDebit.toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-1">Amount paid</p>
        </CardContent>
      </Card>

      {/* Net Balance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Net Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${
            summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{summary.netBalance.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {summary.netBalance >= 0 ? 'Amount due to farmer' : 'Amount due from farmer'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LedgerSummary;
