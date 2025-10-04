/**
 * Centralized API client with backend flexibility
 * Can easily switch between Supabase and Azure SQL backends
 */

import config from '../config';
import { toastService } from './toastService';

// Configuration - easily switchable between backends
const API_CONFIG = {
  baseURL: config.apiBaseUrl,
  timeout: 10000,
  retries: 3,
};

// Request interceptor type
type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

// Response interceptor type
type ResponseInterceptor = (response: any, config?: RequestConfig) => any | Promise<any>;

interface RequestConfig extends RequestInit {
  url: string;
  timeout?: number;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private usedFallbackBase: boolean = false;

  constructor(apiConfig: typeof API_CONFIG) {
    // Sanitize baseURL to avoid malformed placeholders injected at runtime
    let base = apiConfig.baseURL || '';
    const DEFAULT_BASE = 'https://kisaancenter-backend.whiteisland-e1233153.northeurope.azurecontainerapps.io/api';
    try {
      // If base is missing, empty, or contains angle-bracket placeholders, use a safe fallback.
      // Also avoid silently re-using a placeholder value from config.apiBaseUrl — ensure it's validated.
      const isInvalid = typeof base !== 'string' || /^\s*$/.test(base) || base.includes('<') || base.includes('>');
      if (isInvalid) {
        console.warn('[apiClient] Invalid or placeholder API base URL detected, selecting fallback:', base);
        // Prefer a validated config.apiBaseUrl if it is well-formed, otherwise use the DEFAULT_BASE
        const candidate = (typeof config?.apiBaseUrl === 'string' && !/^\s*$/.test(config.apiBaseUrl) && !config.apiBaseUrl.includes('<') && !config.apiBaseUrl.includes('>'))
          ? config.apiBaseUrl
          : DEFAULT_BASE;
        base = candidate;
      }
    } catch (e) {
      // On any unexpected error, fallback to the DEFAULT_BASE
      console.warn('[apiClient] Error validating API base URL, falling back to default backend URL', e);
      base = DEFAULT_BASE;
    }
  this.baseURL = base;
  // Mark whether we had to use a fallback value so the UI can detect misconfiguration
  this.usedFallbackBase = base === DEFAULT_BASE || (typeof config?.apiBaseUrl === 'string' && (config.apiBaseUrl.includes('<') || config.apiBaseUrl.includes('>')) && base === DEFAULT_BASE);
  this.timeout = apiConfig.timeout;
    
    // Add default request interceptor for auth
    this.addRequestInterceptor(this.addAuthHeader.bind(this));
    
    // Add default response interceptor for error handling
    this.addResponseInterceptor(this.handleResponse.bind(this));
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // Default auth header interceptor
  private async addAuthHeader(config: RequestConfig): Promise<RequestConfig> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  }

  // Default response handler with toast integration
  private async handleResponse<T>(response: Response, config?: RequestConfig): Promise<T> {
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
      
      // Show error toast if enabled (default: true for errors)
      if (config?.showErrorToast !== false) {
        if (response.status === 401) {
          toastService.authError(config?.errorMessage || 'Authentication required');
        } else if (response.status === 403) {
          toastService.permissionError(config?.errorMessage || 'Access denied');
        } else if (response.status >= 500) {
          toastService.networkError(config?.errorMessage || 'Server error occurred');
        } else {
          toastService.apiError(errorMessage, config?.errorMessage);
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Show success toast if enabled and it's a successful mutation
    if (config?.showSuccessToast && (config?.method === 'POST' || config?.method === 'PUT' || config?.method === 'DELETE')) {
      toastService.apiSuccess(data, config?.successMessage);
    }
    
    return data;
  }

  // Core request method
  private async request<T>(config: RequestConfig): Promise<T> {
    let finalConfig = { ...config };
    
    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // Add default headers
    finalConfig.headers = {
      'Content-Type': 'application/json',
      ...finalConfig.headers,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${config.url}`, {
        ...finalConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Apply response interceptors
      let result: any = response;
      for (const interceptor of this.responseInterceptors) {
        result = await interceptor(result, finalConfig);
      }

      return result as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // HTTP methods with toast support
  async get<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'GET',
    });
  }

  async post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      showSuccessToast: true, // Default to show success toast for mutations
      ...config,
      url,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      showSuccessToast: true, // Default to show success toast for mutations
      ...config,
      url,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      showSuccessToast: true,
      ...config,
      url,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      showSuccessToast: true, // Default to show success toast for mutations
      ...config,
      url,
      method: 'DELETE',
    });
  }

  // Utility methods for common patterns with toast customization
  
  // Silent methods (no toast notifications)
  async getSilent<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.get<T>(url, { ...config, showErrorToast: false });
  }

  async postSilent<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.post<T>(url, data, { ...config, showSuccessToast: false, showErrorToast: false });
  }

  async putSilent<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.put<T>(url, data, { ...config, showSuccessToast: false, showErrorToast: false });
  }

  async deleteSilent<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.delete<T>(url, { ...config, showSuccessToast: false, showErrorToast: false });
  }

  // Methods with custom messages
  async postWithMessage<T>(url: string, data?: any, successMessage?: string, errorMessage?: string): Promise<T> {
    return this.post<T>(url, data, { successMessage, errorMessage });
  }

  async putWithMessage<T>(url: string, data?: any, successMessage?: string, errorMessage?: string): Promise<T> {
    return this.put<T>(url, data, { successMessage, errorMessage });
  }

  async deleteWithMessage<T>(url: string, successMessage?: string, errorMessage?: string): Promise<T> {
    return this.delete<T>(url, { successMessage, errorMessage });
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_CONFIG);

// Expose sanitized base URL for services that need to build full URLs
export const getSanitizedApiBase = (): string => apiClient['baseURL'] || '';

// Allow runtime detection of whether a fallback base was used (useful to show admin message)
export const isUsingFallbackApiBase = (): boolean => !!apiClient['usedFallbackBase'];

// Export types for use in services
export type { RequestConfig, RequestInterceptor, ResponseInterceptor };