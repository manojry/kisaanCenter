/// <reference types="node" />
import axios from 'axios'
import { APIResponse } from '@/types/api'
// @ts-ignore: No type declarations for react-hot-toast
import toast from 'react-hot-toast'

class ApiClient {
  private client: any

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: any) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        const errorMessage = error.response?.data?.message || 'An error occurred'

        if (error.response?.status === 401) {
          localStorage.clear(); // Clear all localStorage including userrole
          window.location.href = '/login';
          return Promise.reject(error);
        }

        toast.error(errorMessage)
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, params?: any): Promise<APIResponse<T>> {
  const response = await this.client.get(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<APIResponse<T>> {
  const response = await this.client.post(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<APIResponse<T>> {
  const response = await this.client.put(url, data)
    return response.data
  }

  async patch<T>(url: string, data?: any): Promise<APIResponse<T>> {
  const response = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<APIResponse<T>> {
  const response = await this.client.delete(url)
    return response.data
  }
}

export const apiClient = new ApiClient()