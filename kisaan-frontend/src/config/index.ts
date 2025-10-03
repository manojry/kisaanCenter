// Environment configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://kisaancenter-backend.whiteisland-e1233153.northeurope.azurecontainerapps.io/api',
  environment: import.meta.env.VITE_ENVIRONMENT || 'production',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Safe getter for owner dashboard API so callers can get a sanitized URL at runtime
export const getOwnerDashboardApi = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL || config.apiBaseUrl || '';
  if (typeof base === 'string' && (base.includes('<') || base.includes('>') || /^\s*$/.test(base))) {
    // Fallback to relative path
    return '/owner-dashboard/dashboard';
  }
  return `${base.replace(/\/$/, '')}/owner-dashboard/dashboard`;
};

export default config;