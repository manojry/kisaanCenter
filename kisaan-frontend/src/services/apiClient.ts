/**
 * Centralized API client with backend flexibility
 * Can easily switch between Supabase and Azure SQL backends
 */



// Configuration - easily switchable between backends
const API_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  retries: 3,
};

// Request interceptor type
type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

// Response interceptor type
type ResponseInterceptor = (response: any) => any | Promise<any>;

interface RequestConfig extends RequestInit {
  url: string;
  timeout?: number;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: typeof API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    
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
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  }

  // Default response handler
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as Promise<T>;
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
        result = await interceptor(result);
      }

      return result as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // HTTP methods
  async get<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'GET',
    });
  }

  async post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      ...config,
      url,
      method: 'DELETE',
    });
  }

  // Utility methods for common patterns
  // Remove getPaginated for now (no PaginatedResponse type found)

  // Remove postWithResponse for now (no APIResponse type found or used)
}

// Create singleton instance
export const apiClient = new ApiClient(API_CONFIG);

// Export types for use in services
export type { RequestConfig, RequestInterceptor, ResponseInterceptor };