// Utility to format ISO date string as DD/MM/YYYY
export function formatDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '-';
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (typeof dateInput === 'string') {
    // Try ISO, fallback to parse
    date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      // Try parsing as number string
      const num = Number(dateInput);
      if (!isNaN(num)) {
        date = new Date(num);
      }
    }
  } else {
    return '-';
  }
  if (isNaN(date.getTime())) return '-';
  // Use toLocaleString for robust fallback
  return date.toLocaleString();
}
