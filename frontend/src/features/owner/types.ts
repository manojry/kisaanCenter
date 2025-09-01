export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  // Add other product fields as needed
}
