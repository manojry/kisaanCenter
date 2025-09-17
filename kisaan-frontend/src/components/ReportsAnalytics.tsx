import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { BarChart3, AlertCircle, Calendar } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';
import { Pie, Bar } from './Charts';

interface ReportsAnalyticsProps {
  shopId?: number;
}


interface DailyAnalytics {
  date: string;
  total_sales: number;
  total_commission: number;
}

interface Analytics {
  total_transactions: number;
  total_sales: number;
  total_commission: number;
  total_farmer_earnings?: number;
  total_deficit?: number;
  status_summary?: Record<string, number>;
  income_by_status?: Record<string, number>;
  daily?: DailyAnalytics[];
}

export default function ReportsAnalytics({ shopId }: ReportsAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  useEffect(() => {
    fetchAnalytics();
  }, [shopId]);

  const fetchAnalytics = async () => {
    if (!shopId) return;
    setIsLoading(true);
    setError(null);
    try {
      const analyticsData = await analyticsApi.getShopAnalytics(shopId, dateRange);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (field: string, value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };



  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'text-green-600',
      partial: 'text-yellow-600',
      credit: 'text-red-600',
      farmer_due: 'text-orange-600'
    };
    return colors[status] || 'text-gray-600';
  };

  // Prepare daily chart data
  const daily = analytics?.daily || [];
  const hasDaily = daily.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 w-full items-center">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-gray-600 flex items-center gap-1"><Calendar className="h-4 w-4" />From</span>
                <DatePicker
                  id="date_from"
                  selected={dateRange.from ? parseISO(dateRange.from) : null}
                  onChange={date => handleDateRangeChange('from', date ? date.toISOString().slice(0, 10) : '')}
                  dateFormat="yyyy-MM-dd"
                  className="px-2 py-1 text-sm rounded-md border w-full min-w-0"
                  placeholderText="Select date"
                  /* width handled by className */
                  isClearable
                  showPopperArrow={false}
                />
            </div>
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-gray-600 flex items-center gap-1"><Calendar className="h-4 w-4" />To</span>
                <DatePicker
                  id="date_to"
                  selected={dateRange.to ? parseISO(dateRange.to) : null}
                  onChange={date => handleDateRangeChange('to', date ? date.toISOString().slice(0, 10) : '')}
                  dateFormat="yyyy-MM-dd"
                  className="px-2 py-1 text-sm rounded-md border w-full min-w-0"
                  placeholderText="Select date"
                  /* width handled by className */
                  isClearable
                  showPopperArrow={false}
                />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button onClick={fetchAnalytics} className="px-2 py-1 text-sm rounded-md w-full">
                Apply
              </Button>
              <Button variant="outline" onClick={() => handleDateRangeChange('clear', '')} className="px-2 py-1 text-xs rounded-md w-full">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      {analytics && (
        <>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            <Card className="p-2">
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-xs font-semibold">Total Sales</CardTitle>
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-1">
                <div className="font-bold break-words whitespace-normal leading-tight text-base" style={{fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', wordBreak: 'break-all'}}>{formatCurrency(Number(analytics.total_sales) || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Number(analytics.total_transactions) || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-xs font-semibold">Commission Earned</CardTitle>
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-1">
                <div className="font-bold break-words whitespace-normal leading-tight text-base" style={{fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', wordBreak: 'break-all'}}>{formatCurrency(Number(analytics.total_commission) || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From all transactions
                </p>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-xs font-semibold">Outstanding</CardTitle>
                <AlertCircle className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-1">
                <div className="font-bold text-red-600 break-words whitespace-normal leading-tight text-base" style={{fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', wordBreak: 'break-all'}}>
                  {formatCurrency(
                    (analytics.status_summary?.pending_to_farmer || 0) + (analytics.status_summary?.pending_from_buyer || 0)
                    || Number(analytics.total_deficit) || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  To be collected
                </p>
              </CardContent>
            </Card>

            {((Number(analytics.total_sales) || 0) - (Number(analytics.total_deficit) || 0)) !== (Number(analytics.total_sales) || 0) && (
              <Card className="p-2">
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-xs font-semibold">Net Income</CardTitle>
                  <BarChart3 className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-1">
                  <div className="font-bold text-green-600 break-words whitespace-normal leading-tight text-base" style={{fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', wordBreak: 'break-all'}}>
                    {formatCurrency((Number(analytics.total_sales) || 0) - (Number(analytics.total_deficit) || 0))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actual received
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Daily Sales/Commission Chart */}
          {hasDaily && (
            <Card>
              <CardHeader>
                <CardTitle>Sales & Commission (Last 30 Days)</CardTitle>
                <CardDescription>Time series of total sales and commission per day</CardDescription>
              </CardHeader>
              <CardContent style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bar
                  data={{
                    labels: daily.map((d) => d.date),
                    datasets: [
                      {
                        label: 'Total Sales',
                        data: daily.map((d) => d.total_sales),
                        backgroundColor: '#3b82f6',
                        maxBarThickness: 24,
                      },
                      {
                        label: 'Commission',
                        data: daily.map((d) => d.total_commission),
                        backgroundColor: '#f59e42',
                        maxBarThickness: 24,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ₹${Number(context.parsed.y).toLocaleString()}`;
                          }
                        }
                      }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        ticks: { font: { size: 12 }, maxRotation: 40, minRotation: 0 },
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) { return '₹' + Number(value).toLocaleString(); },
                          font: { size: 12 }
                        }
                      }
                    },
                  }}
                  height={220}
                />
              </CardContent>
            </Card>
          )}

          {/* Status Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pie Chart for Transaction Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Pie chart of transaction status</CardDescription>
              </CardHeader>
              <CardContent style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Object.values(analytics.status_summary || {}).reduce((a, b) => a + b, 0) === 0 ? (
                  <div className="text-muted-foreground text-center w-full">No data to display</div>
                ) : (
                  <Pie
                    data={{
                      labels: Object.keys(analytics.status_summary || {}).map(l => l.replace('_', ' ').toUpperCase()),
                      datasets: [
                        {
                          data: Object.values(analytics.status_summary || {}),
                          backgroundColor: [
                            '#22c55e', // green
                            '#eab308', // yellow
                            '#ef4444', // red
                            '#f97316', // orange
                            '#64748b', // gray
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              return `${label}: ${value.toLocaleString()}`;
                            }
                          }
                        }
                      },
                      maintainAspectRatio: false,
                    }}
                    height={220}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Status Summary</CardTitle>
                <CardDescription>Key financial status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-yellow-50 p-6 flex flex-col items-center shadow-sm min-w-[140px]">
                    <span className="text-xs font-semibold text-yellow-700 tracking-wide uppercase mb-1 text-center break-words">Pending to Farmer</span>
                    <span className="font-bold text-yellow-900 text-center w-full" style={{fontSize: 'clamp(0.8rem, 1.8vw, 1.3rem)', whiteSpace: 'nowrap', maxWidth: '100%'}}>{formatCurrency(analytics.status_summary?.pending_to_farmer || 0)}</span>
                  </div>
                  <div className="rounded-lg bg-red-50 p-6 flex flex-col items-center shadow-sm min-w-[140px]">
                    <span className="text-xs font-semibold text-red-700 tracking-wide uppercase mb-1 text-center break-words">Pending from Buyer</span>
                    <span className="font-bold text-red-900 text-center w-full" style={{fontSize: 'clamp(0.8rem, 1.8vw, 1.3rem)', whiteSpace: 'nowrap', maxWidth: '100%'}}>{formatCurrency(analytics.status_summary?.pending_from_buyer || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Income by Status card removed as requested */}
          </div>
        </>
      )}

      {!analytics && !isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No analytics data available. Create some transactions to see reports.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}