// Environment configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || ' http://localhost:8000/api',
  environment: import.meta.env.VITE_ENVIRONMENT || 'production',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;