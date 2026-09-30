/**
 * formatters.ts — Local utility functions for SnapIt Merchant Dashboard.
 * Formats integer Paise to Rupees and timestamps to legible counter display.
 */

/**
 * Converts an integer Paise value to a formatted Rupee string.
 * @param paise - Amount in Paise (integer). e.g. 14900
 * @returns Formatted string like "₹149" or "₹149.50"
 */
export const formatCurrency = (paise: number): string => {
  if (!Number.isInteger(paise)) {
    paise = Math.round(paise);
  }
  const rupees = paise / 100;
  return `₹${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`;
};

/**
 * Converts a delivery ETA in minutes to a human-readable string.
 * @param minutes - Estimated delivery time in minutes.
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
 */
export const formatOrderTime = (isoString: string): string => {
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  } catch {
    return isoString;
  }
};

/**
 * Maps an OrderStatus code to human-readable label and color classes.
 */
export const getOrderStatusDisplay = (
  status: string
): { label: string; colorClass: string } => {
  const map: Record<string, { label: string; colorClass: string }> = {
    PENDING: { label: 'New Order', colorClass: 'text-amber-900 bg-amber-100' },
    PLACED: { label: 'New Order', colorClass: 'text-amber-900 bg-amber-100' },
    PAID: { label: 'Payment Confirmed', colorClass: 'text-blue-800 bg-blue-100' },
    ACCEPTED: { label: 'Accepted', colorClass: 'text-emerald-800 bg-emerald-100' },
    PREPARING: { label: 'Packing', colorClass: 'text-blue-800 bg-blue-100' },
    READY: { label: 'Ready for Pickup', colorClass: 'text-emerald-800 bg-emerald-100' },
    READY_FOR_PICKUP: { label: 'Ready for Pickup', colorClass: 'text-emerald-800 bg-emerald-100' },
    RIDER_ASSIGNED: { label: 'Rider Assigned', colorClass: 'text-purple-800 bg-purple-100' },
    PICKED_UP: { label: 'On Way', colorClass: 'text-blue-800 bg-blue-100' },
    OUT_FOR_DELIVERY: { label: 'On Way', colorClass: 'text-blue-800 bg-blue-100' },
    RIDER_AT_LOC: { label: 'On Way', colorClass: 'text-blue-800 bg-blue-100' },
    DELIVERED: { label: 'Delivered', colorClass: 'text-emerald-800 bg-emerald-100' },
    CANCELLED: { label: 'Cancelled', colorClass: 'text-rose-800 bg-rose-100' },
  };
  return map[status] ?? { label: status, colorClass: 'text-slate-700 bg-slate-100' };
};
