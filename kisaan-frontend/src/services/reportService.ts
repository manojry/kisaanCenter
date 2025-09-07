import { apiClient } from './apiClient';

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
    return response.data;
  },

  async downloadReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`${apiClient.defaults.baseURL}/reports/download?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filters.report_type}-report-${Date.now()}.html`;
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
    
    const response = await fetch(`${apiClient.defaults.baseURL}/reports/generate?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate report preview');
    }

    const html = await response.text();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  }
};