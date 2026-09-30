/**
 * Formats a currency value stored in paise (integers) to a readable string format.
 * Example: 14900 -> ₹149.00
 */
export const formatCurrency = (paise: number): string => {
  const rupees = paise / 100;
  // Use Intl.NumberFormat for proper local formatting if desired
  // Using explicit ₹ for consistency as requested
  return `₹${rupees.toFixed(2).replace(/\.00$/, '')}`;
};
