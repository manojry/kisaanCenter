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
  const [reportType, setReportType] = useState<'farmer' | 'user' | 'shop'>('shop');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const farmers = users.filter(u => u.role === 'farmer');
  const buyers = users.filter(u => u.role === 'buyer');

  const handleGenerateReport = async (download = false) => {
    setIsGenerating(true);
    setError(null);

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
      } else {
        await reportService.previewReport(filters);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate PDF Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="reportType">Report Type</Label>
          <Select value={reportType} onValueChange={(value: any) => {
            setReportType(value);
            setSelectedUser('');
          }}>
            <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="user">
              Select {reportType === 'farmer' ? 'Farmer' : 'User'}
            </Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
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
              <p className="text-sm text-muted-foreground">
                No {reportType}s found. Please add {reportType}s first.
              </p>
            )}
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">From Date (Optional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">To Date (Optional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={() => handleGenerateReport(false)}
            disabled={isGenerating || (isUserRequired && !selectedUser)}
            className="flex-1"
            variant="outline"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Preview Report
          </Button>
          <Button
            onClick={() => handleGenerateReport(true)}
            disabled={isGenerating || (isUserRequired && !selectedUser)}
            className="flex-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Shop Report:</strong> All transactions for the shop</p>
          <p><strong>Farmer Report:</strong> Sales, payments, and balance for a specific farmer</p>
          <p><strong>User Report:</strong> Purchase history for a specific buyer</p>
          <p>Leave dates empty to include all transactions.</p>
        </div>
      </CardContent>
    </Card>
  );
}