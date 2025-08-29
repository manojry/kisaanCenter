import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { APIResponse } from '@/types/api'
import toast from 'react-hot-toast'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:8000/api/v1',
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
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse<APIResponse>) => response,
      (error) => {
        const errorMessage = error.response?.data?.message || 'An error occurred'
        
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        toast.error(errorMessage)
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, params?: any): Promise<APIResponse<T>> {
    const response = await this.client.get<APIResponse<T>>(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.client.post<APIResponse<T>>(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.client.put<APIResponse<T>>(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<APIResponse<T>> {
    const response = await this.client.delete<APIResponse<T>>(url)
    return response.data
  }
}

export const apiClient = new ApiClient()