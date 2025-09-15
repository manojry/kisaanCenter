import { apiClient } from './apiClient';

// Removed hardcoded API_BASE_URL, use apiClient for all requests
interface ReportFilters {
  shop_id: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  report_type: 'farmer' | 'user' | 'shop';
}

export const reportService = {
  async generateReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await apiClient.get(`/reports/generate?${params.toString()}`);
  return (response as any).data;
  },

  async downloadReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await apiClient.get(`/reports/download?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    // Assume response is a blob
    const blob = response as Blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Use .csv for shop report, .html for others
    const ext = filters.report_type === 'shop' ? 'csv' : 'html';
    let extension = ext;
    if (filters.report_type === 'shop') extension = 'pdf';
    link.download = `${filters.report_type}-report-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async previewReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    params.append('format', 'pdf');
    
    const response = await apiClient.get(`/reports/generate?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    // Assume response is HTML string
    const html = response as string;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  }
};