/**
 * Utility functions for Email validation and formatting.
 *
 * Requirements:
 * 1. Standard email format (e.g. rider@example.com)
 * 2. Reject missing @ symbol
 * 3. Reject missing domain or invalid domain format
 * 4. Reject improper characters or whitespace
 * 5. Trim leading and trailing whitespace before validation
 */

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates whether an email string matches standard email formatting.
 * Trims leading/trailing whitespace before validation.
 */
export function validateEmail(email: string): EmailValidationResult {
  const trimmed = (email || '').trim();

  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }

  // Check for spaces within email
  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Email address cannot contain spaces.' };
  }

  // Check for presence of @
  if (!trimmed.includes('@')) {
    return { isValid: false, error: 'Email address is missing an "@" symbol.' };
  }

  // Split username and domain
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Email address must contain only one "@" symbol.' };
  }

  const [local, domain] = parts;

  if (!local) {
    return { isValid: false, error: 'Please enter a username before the "@" symbol.' };
  }

  if (!domain) {
    return { isValid: false, error: 'Please enter a domain after the "@" symbol (e.g. rider@example.com).' };
  }

  if (!domain.includes('.')) {
    return { isValid: false, error: 'Email domain is missing an extension (e.g. rider@example.com).' };
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return { isValid: false, error: 'Email domain is improperly formatted.' };
  }

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return { isValid: false, error: 'Email domain extension must be at least 2 characters.' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. rider@example.com).' };
  }

  return { isValid: true };
}

/**
 * Returns true if the string is a valid email address.
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}
