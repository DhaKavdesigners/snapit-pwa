/**
 * formatters.ts — Shared utility functions used by all three SnapIt apps.
 *
 * Import in any app:
 *   import { formatCurrency, formatEta } from '../../shared/utils/formatters';
 */

/**
 * Converts an integer Paise value to a formatted Rupee string.
 * @param paise - Amount in Paise (integer). e.g. 14900
 * @returns Formatted string like "₹149" or "₹149.50"
 * @example formatCurrency(14900) // → "₹149"
 * @example formatCurrency(14950) // → "₹149.50"
 */
export const formatCurrency = (paise: number): string => {
  if (!Number.isInteger(paise)) {
    console.error('[formatCurrency] Received non-integer value. All prices must be in Paise (integers).');
    paise = Math.round(paise);
  }
  const rupees = paise / 100;
  // Show decimals only if there are paise (e.g. ₹149.50), not ₹149.00
  return `₹${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`;
};

/**
 * Converts a delivery ETA in minutes to a human-readable string.
 * @param minutes - Estimated delivery time in minutes.
 * @returns e.g. "10 min", "1 hr 5 min"
 */
export const formatEta = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
};

/**
 * Formats an ISO 8601 timestamp to a readable local date/time string.
 * @param isoString - e.g. "2024-01-15T14:30:00Z"
 * @returns e.g. "15 Jan 2024, 8:00 PM"
 */
export const formatOrderTime = (isoString: string): string => {
  return new Date(isoString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Maps an OrderStatus code to a human-readable label and a color class.
 * Use these classes with your Tailwind theme.
 */
export const getOrderStatusDisplay = (
  status: string
): { label: string; colorClass: string } => {
  const map: Record<string, { label: string; colorClass: string }> = {
    PENDING:    { label: 'Order Placed',      colorClass: 'text-yellow-600 bg-yellow-50' },
    PAID:       { label: 'Payment Confirmed', colorClass: 'text-blue-600 bg-blue-50' },
    ACCEPTED:   { label: 'Accepted',          colorClass: 'text-brand bg-green-50' },
    PREPARING:  { label: 'Being Prepared',    colorClass: 'text-orange-600 bg-orange-50' },
    READY:      { label: 'Ready for Pickup',  colorClass: 'text-brand bg-green-50' },
    PICKED_UP:  { label: 'Out for Delivery',  colorClass: 'text-brand bg-green-50' },
    DELIVERED:  { label: 'Delivered',         colorClass: 'text-brand bg-green-50' },
    CANCELLED:  { label: 'Cancelled',         colorClass: 'text-red-600 bg-red-50' },
  };
  return map[status] ?? { label: status, colorClass: 'text-gray-600 bg-gray-50' };
};
