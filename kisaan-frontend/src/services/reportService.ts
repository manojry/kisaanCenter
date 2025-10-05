import { apiClient, getSanitizedApiBase } from './apiClient';
import config from '../config';

// DRY helper for authorized fetch
export const authorizedFetch = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });
};

const API_BASE_URL = getSanitizedApiBase() || config.apiBaseUrl || '';

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
    // If using fetch, get blob from response
  const response = await authorizedFetch(`${API_BASE_URL}/reports/generate?${params.toString()}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
  const extension = 'pdf';
    link.download = `${filters.report_type}-report-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async downloadReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    // If using fetch, get blob from response
  const response = await authorizedFetch(`${API_BASE_URL}/reports/download?${params.toString()}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
  const extension = 'pdf';
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
    
  const response = await apiClient.get(`${API_BASE_URL}/reports/generate?${params.toString()}`, {
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