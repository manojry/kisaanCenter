/**
 * Service layer helper utilities
 * Provides:
 *  - buildQueryString: safely build a query string from an object of params
 *  - normalizeListResponse: coerce variable backend list response shapes into PaginatedResponse<T>
 */

// Generic shape used across getAll style endpoints
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Build a query string from params (skips undefined/null/empty). Includes leading '?' or returns '' */
export function buildQueryString(params?: Record<string, any> | undefined): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(v => {
        if (v !== undefined && v !== null && v !== '') search.append(key, String(v));
      });
    } else if (value instanceof Date) {
      search.append(key, value.toISOString());
    } else {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

interface NormalizeOptions {
  /** candidate keys to probe for list array */
  keys?: string[];
  /** fallback limit if backend doesn't send pagination meta */
  limit?: number;
  /** default page */
  page?: number;
}

// Default candidate keys frequently observed in backend responses
const DEFAULT_LIST_KEYS = ['data', 'items', 'results', 'list', 'rows', 'users', 'products', 'transactions', 'payments'];

/**
 * Normalize variable backend list responses into a consistent PaginatedResponse<T>.
 * Supported raw formats:
 *  - { data: T[] }
 *  - { items/results/list/rows: T[] }
 *  - { users/products/transactions/payments: T[] }
 *  - T[] (array directly)
 *  - Any object containing a candidate key with array value
 */
export function normalizeListResponse<T = any>(raw: any, options?: NormalizeOptions): PaginatedResponse<T> {
  const keys = options?.keys?.length ? options.keys : DEFAULT_LIST_KEYS;
  let array: any[] = [];

  if (Array.isArray(raw)) {
    array = raw;
  } else if (raw && typeof raw === 'object') {
    // Identify first candidate key containing an array
    const foundKey = keys.find(k => Array.isArray((raw as any)[k]));
    if (foundKey) {
      array = (raw as any)[foundKey];
    } else if (Array.isArray(raw.data)) {
      array = raw.data; // fallback if not captured
    }
  }

  // If still empty and raw.data could be non-array with nested arrays, attempt shallow scan
  if (array.length === 0 && raw && typeof raw === 'object') {
    for (const v of Object.values(raw)) {
      if (Array.isArray(v)) { array = v; break; }
    }
  }

  // Pagination meta inference
  const page = Number(raw?.page) || options?.page || 1;
  const limit = Number(raw?.limit) || options?.limit || array.length || 10;
  const total = Number(raw?.total) || (Array.isArray(array) ? array.length : 0);
  const totalPages = Number(raw?.totalPages) || Math.ceil(total / (limit || 1)) || 1;

  return {
    data: Array.isArray(array) ? array : [],
    total,
    page,
    limit,
    totalPages
  };
}

// Convenience combo for typical list endpoint implementations
export function fetchAndNormalizeList<T>(promise: Promise<any>, opts?: NormalizeOptions): Promise<PaginatedResponse<T>> {
  return promise.then(raw => normalizeListResponse<T>(raw, opts));
}

/**
 * Normalize single item responses that may have duplicate or inconsistent data structures.
 * Handles cases like:
 * - { success: true, data: { user: {...} }, user: {...} } (duplicate user data)
 * - { success: true, data: {...} }
 * - { success: true, user: {...} }
 */
export function normalizeSingleItemResponse<T = any>(raw: any, itemKey?: string): T | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // If there's a data property, prefer it first
  if (raw.data) {
    // Check if data has the specific item key (e.g., data.user)
    if (itemKey && raw.data[itemKey]) {
      return raw.data[itemKey];
    }
    // Otherwise return data directly if it looks like the item
    if (typeof raw.data === 'object' && !Array.isArray(raw.data)) {
      return raw.data;
    }
  }

  // Fallback to the direct item key (e.g., raw.user)
  if (itemKey && raw[itemKey]) {
    return raw[itemKey];
  }

  // If no specific key provided, try common keys
  const commonKeys = ['user', 'shop', 'product', 'category', 'transaction', 'payment'];
  for (const key of commonKeys) {
    if (raw[key] && typeof raw[key] === 'object') {
      return raw[key];
    }
  }

  return null;
}
