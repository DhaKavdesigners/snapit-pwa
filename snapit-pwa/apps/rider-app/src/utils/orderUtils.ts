/**
 * Formats an order ID/number to match the exact Customer Dashboard order identifier.
 * Preserves formats such as 'ORD-123456', 'MM10245', '123456', etc.
 */
export function formatOrderNumber(raw: string | number | undefined | null): string {
  if (raw === undefined || raw === null || raw === '') return '000000';
  const str = String(raw).trim();
  // Strip leading '#' if present so callers can safely prefix '#' or use cleanly
  return str.startsWith('#') ? str.slice(1) : str;
}

