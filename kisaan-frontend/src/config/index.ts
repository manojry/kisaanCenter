// Environment configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://kisaancenter-backend.whiteisland-e1233153.northeurope.azurecontainerapps.io/api',
  environment: import.meta.env.VITE_ENVIRONMENT || 'production',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export const OWNER_DASHBOARD_API = `${config.apiBaseUrl}/owner-dashboard/dashboard`;

export default config;