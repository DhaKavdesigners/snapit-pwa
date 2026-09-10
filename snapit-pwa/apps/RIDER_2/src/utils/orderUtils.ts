/**
 * Formats any order number or database ID into a standardized 6-digit display format for the Rider Dashboard.
 * E.g., '97258' -> '097258', 197258 -> '197258', 'SN12345' -> '012345'
 */
export function formatOrderNumber(raw: string | number | undefined | null): string {
  if (raw === undefined || raw === null || raw === '') return '000000';
  const str = String(raw).trim();
  const digits = str.replace(/\D/g, '');
  if (digits.length >= 6) {
    return digits.slice(-6);
  }
  if (digits.length > 0) {
    return digits.padStart(6, '0');
  }
  const alnum = str.replace(/[^a-zA-Z0-9]/g, '');
  if (alnum.length >= 6) {
    return alnum.slice(-6).toUpperCase();
  }
  return alnum.toUpperCase().padStart(6, '0');
}
