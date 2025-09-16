import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Download, 
  FileText, 
  Calendar,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { reportService } from '../services/reportService';

interface ReportFilters {
  shop_id: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  report_type: 'farmer' | 'user' | 'shop';
}

interface PDFReportGeneratorProps {
  shopId: string;
  users?: Array<{ id: string; username: string; role: string }>;
}

export default function PDFReportGenerator({ shopId, users = [] }: PDFReportGeneratorProps) {
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [reportType, setReportType] = useState<'farmer' | 'user' | 'shop'>('shop');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const farmers = users.filter(u => u.role === 'farmer');
  const buyers = users.filter(u => u.role === 'buyer');

  const handleGenerateReport = async (download = false) => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const filters: ReportFilters = {
        shop_id: shopId,
        report_type: reportType,
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
        ...(selectedUser && { user_id: selectedUser })
      };
      if (download) {
        await reportService.downloadReport(filters);
        setSuccess('PDF downloaded successfully!');
      } else {
        const rows = await reportService.generateReport(filters);
        setReportRows(Array.isArray(rows) ? rows : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
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
        {/* Render generated report as table */}
        {reportRows.length > 0 && (
          <div className="mt-4">
            <table className="w-full text-xs border">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Buyer</th>
                  <th>Farmer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map(row => (
                  <tr key={row.transaction_id}>
                    <td>{row.transaction_id}</td>
                    <td>{row.buyer}</td>
                    <td>{row.farmer}</td>
                    <td>{row.product}</td>
                    <td>{row.quantity}</td>
                    <td>{row.unit_price}</td>
                    <td>{row.total_amount}</td>
                    <td>{row.paid_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default">
            <Download className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Report Type Selection */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="reportType" className="text-xs">Report Type</Label>
          <Select value={reportType} onValueChange={(value: any) => {
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
                {availableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.username} ({user.role})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No {reportType}s found. Please add {reportType}s first.
              </p>
            )}
          </div>
        )}

        {/* Date Range */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-2 w-full">
            <Label htmlFor="dateFrom" className="text-xs">From</Label>
            <div className="relative w-full">
              <Calendar className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-8 text-sm py-1 rounded-md w-full"
                style={{maxWidth: '140px'}}
              />
            </div>
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <Label htmlFor="dateTo" className="text-xs">To</Label>
            <div className="relative w-full">
              <Calendar className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-8 text-sm py-1 rounded-md w-full"
                style={{maxWidth: '140px'}}
              />
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
            onClick={() => handleGenerateReport(true)}
            disabled={isGenerating || (isUserRequired && !selectedUser)}
            className="text-xs px-2 py-1 rounded-md flex-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Download
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