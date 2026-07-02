/**
 * Format a Date as "YYYY-MM-DD".
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse "YYYY-MM-DD" to Date (local).
 */
export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get yesterday's date string.
 */
export function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

/**
 * Get a Date N days ago.
 */
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

/**
 * Number of days between two date strings.
 */
export function daysBetween(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  return Math.round((db - da) / 86400000);
}
