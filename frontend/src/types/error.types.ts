
export interface APIError {
  success: false;
  message: string;
  error_code?: string;
  errors?: string[];
  timestamp: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  errors: string[];
  errorCode?: string;
}

// File: frontend/src/utils/errorHandler.ts
export const handleAPIError = (error: any): ErrorState => {
  if (error.response?.data) {
    const apiError: APIError = error.response.data;
    return {
      hasError: true,
      message: apiError.message,
      errors: apiError.errors || [],
      errorCode: apiError.error_code
    };
  }
  
  return {
    hasError: true,
    message: "An unexpected error occurred",
    errors: [],
    errorCode: "UNKNOWN_ERROR"
  };
};
