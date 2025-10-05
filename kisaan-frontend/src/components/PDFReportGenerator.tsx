import { useState } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { formatDate, getToday } from '../utils/dateUtils';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, FileText, Calendar, User, Loader2 } from 'lucide-react';
import { reportService } from '../services/reportService';
import { exportTransactionsPDF } from '../utils/pdf/transactionReport';
import { useToast } from '@/hooks/use-toast';

type ReportFilters = {
  shop_id: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  report_type: 'farmer' | 'user' | 'shop';
};

type UserType = { readonly id: string; readonly username: string; readonly role: string };

interface PDFReportGeneratorProps {
  readonly shopId: string;
  readonly users?: ReadonlyArray<UserType>;
}

export default function PDFReportGenerator({ shopId, users = [] }: PDFReportGeneratorProps) {
  // Use users from Zustand store if available
  const zustandUsers: UserType[] = useTransactionStore((state) =>
    (state.usersByShop?.[shopId] || []).map((u) => ({
      id: String(u.id),
      username: u.username,
      role: u.role
    }))
  );
  const allUsers: ReadonlyArray<UserType> = zustandUsers.length ? zustandUsers : users;

  type ReportRow = {
    id: string | number;
    transaction_id: string | number;
    created_at: string;
    product_name?: string;
    buyer_name?: string;
    farmer_name?: string;
    total_sale_value?: number;
    buyer_paid?: number;
    deficit?: number;
    farmer_paid?: number;
    farmer_due?: number;
    payments?: Array<{
      payer: string;
      payee: string;
      amount: number;
      method: string;
      payment_date: string;
    }>;
    [key: string]: unknown;
  };
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [reportType, setReportType] = useState<'farmer' | 'user' | 'shop'>('shop');
  const [selectedUser, setSelectedUser] = useState('');
  // Set default dates to today
  const [dateFrom, setDateFrom] = useState(getToday());
  const [dateTo, setDateTo] = useState(getToday());
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Remove auto-preview on mount to prevent unwanted downloads or previews

  const farmers = allUsers.filter(u => u.role === 'farmer');
  const buyers = allUsers.filter(u => u.role === 'buyer');

  const handleExportPDF = () => {
    if (!reportRows.length) return;
    const titleMap: Record<string,string> = {
      shop: 'Shop Transactions Report',
      farmer: 'Farmer Transactions Report',
      user: 'User Transactions Report'
    };
    const title = titleMap[reportType] || 'Report';
    const mapped = reportRows.map((row, idx) => ({
      id: (row as { transaction_id?: string | number; id?: string | number }).transaction_id || (row as { id?: string | number }).id || idx + 1,
      transaction_id: (row as { transaction_id?: string | number; id?: string | number }).transaction_id || (row as { id?: string | number }).id || idx + 1,
      created_at: (row as { date?: string; created_at?: string }).date || (row as { created_at?: string }).created_at,
      product_name: (row as { product?: string }).product,
      buyer_name: (row as { buyer?: string }).buyer,
      farmer_name: (row as { farmer?: string }).farmer,
      total_sale_value: (row as { total_amount?: number }).total_amount,
      buyer_paid: (row as { paid_amount?: number }).paid_amount,
      deficit: (row as { buyer_pending?: number; deficit?: number }).buyer_pending || (row as { deficit?: number }).deficit,
      farmer_paid: (row as { farmer_paid?: number }).farmer_paid,
      farmer_due: (row as { farmer_due?: number }).farmer_due,
      payments: Array.isArray((row as { payments?: unknown[] }).payments)
        ? (row as { payments: unknown[] }).payments.map((p) => {
            const pay = p as { payer?: string; payer_type?: string; payee?: string; payee_type?: string; amount: number; method: string; payment_date: string };
            return {
              payer: pay.payer || pay.payer_type || '',
              payee: pay.payee || pay.payee_type || '',
              amount: pay.amount,
              method: pay.method,
              payment_date: pay.payment_date
            };
          })
        : []
    }));
    exportTransactionsPDF(mapped, {
      title,
      generatedBy: selectedUser ? `User ${selectedUser}` : 'System',
      dateRange: { from: dateFrom, to: dateTo }
    });
  };

  const handleGenerateReport = async (download = false) => {
    setIsGenerating(true);
    try {
      const filters: ReportFilters = {
        shop_id: shopId,
        report_type: reportType,
        ...(dateFrom && { date_from: formatDate(dateFrom) }),
        ...(dateTo && { date_to: formatDate(dateTo) }),
        ...(selectedUser && { user_id: selectedUser })
      };
      if (download) {
        await reportService.downloadReport(filters);
        toast({
          title: 'Success',
          description: 'PDF downloaded successfully!',
        });
      } else {
        const rows = await reportService.generateReport(filters);
        setReportRows(Array.isArray(rows) ? (rows as ReportRow[]) : []);
      }
    } catch (err) {
      let message = 'Failed to generate report';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
      }
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isUserRequired = reportType === 'farmer' || reportType === 'user';
  const availableUsers = reportType === 'farmer' ? farmers : buyers;

  return (
    <Card className="p-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Generate PDF Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-2">
        {/* PDF export is card-style only, no table rendering here */}

        {/* Report Type Selection */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="reportType" className="text-xs">Report Type</Label>
          <Select value={reportType} onValueChange={(value: 'farmer' | 'user' | 'shop') => {
            setReportType(value);
            setSelectedUser('');
          }}>
            <SelectTrigger className="text-sm px-2 py-1 rounded-md">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shop">Shop Report (All Transactions)</SelectItem>
              <SelectItem value="farmer">Farmer Report (Sales & Payments)</SelectItem>
              <SelectItem value="user">User Report (Purchases)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Selection (for farmer/user reports) */}
        {isUserRequired && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="user" className="text-xs">
              Select {reportType === 'farmer' ? 'Farmer' : 'User'}
            </Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="text-sm px-2 py-1 rounded-md">
                <SelectValue placeholder={`Select ${reportType}`} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(availableUsers) && availableUsers.length > 0 ? (
                  availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.username} ({user.role})
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground px-2 py-1">No {reportType}s found. Please add {reportType}s first.</div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range - Responsive Layout */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col md:flex-row gap-2 w-full">
            {/* From Date */}
            <div className="flex flex-col flex-1">
              <Label htmlFor="dateFrom" className="text-xs mb-1">From</Label>
              <div className="relative w-full flex items-center gap-2">
                <Calendar className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="pl-8 text-sm py-1 rounded-md w-full"
                  style={{maxWidth: '100%'}}
                  min="2020-01-01"
                  max={getToday()}
                />
                {dateFrom && (
                  <Button type="button" size="sm" variant="ghost" className="px-2 py-1" onClick={() => setDateFrom('')}>
                    Clear
                  </Button>
                )}
              </div>
              {/* Show selected date below on mobile */}
              <span className="block md:hidden text-xs text-muted-foreground mt-1">Selected: {dateFrom || 'None'}</span>
            </div>
            {/* To Date */}
            <div className="flex flex-col flex-1">
              <Label htmlFor="dateTo" className="text-xs mb-1">To</Label>
              <div className="relative w-full flex items-center gap-2">
                <Calendar className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="pl-8 text-sm py-1 rounded-md w-full"
                  style={{maxWidth: '100%'}}
                  min="2020-01-01"
                  max={getToday()}
                />
                {dateTo && (
                  <Button type="button" size="sm" variant="ghost" className="px-2 py-1" onClick={() => setDateTo('')}>
                    Clear
                  </Button>
                )}
              </div>
              {/* Show selected date below on mobile */}
              <span className="block md:hidden text-xs text-muted-foreground mt-1">Selected: {dateTo || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-2 pt-2 w-full justify-between">
          <Button
            onClick={() => handleGenerateReport(false)}
            disabled={isGenerating || (isUserRequired && !selectedUser)}
            className="text-xs px-2 py-1 rounded-md flex-1"
            variant="outline"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-1" />
            )}
            Preview
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={!reportRows.length}
            className="text-xs px-2 py-1 rounded-md flex-1"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-1" />
            Export as PDF
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p><strong>Shop Report:</strong> All transactions for the shop. PDF is branded with Kisaan Center logo and ready for printing.</p>
          <p><strong>Farmer Report:</strong> Sales, payments, and balance for a specific farmer</p>
          <p><strong>User Report:</strong> Purchase history for a specific buyer</p>
          <p>Leave dates empty to include all transactions.</p>
        </div>
      </CardContent>
    </Card>
  );
}