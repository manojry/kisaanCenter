// Shared formatting utilities for numbers, currency, percentages, etc.

export function formatNumber(value: number | null | undefined, opts: Intl.NumberFormatOptions = {}) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, ...opts }).format(value);
}

export function formatCurrency(value: number | null | undefined, currency: string = 'INR') {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  // Use compact for very large numbers? Could add option later.
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value.toFixed(fractionDigits)}%`;
}
