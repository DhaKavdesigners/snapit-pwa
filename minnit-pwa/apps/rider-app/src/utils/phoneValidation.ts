import React from 'react';

/**
 * Utility functions for Indian mobile number validation and input handling.
 *
 * Requirements:
 * 1. Digits only (0-9)
 * 2. Maximum 10 digits (block 11th digit)
 * 3. Indian mobile numbers only: start with 6, 7, 8, or 9
 * 4. Reject foreign country codes and prefixes (+91, +1, etc.)
 * 5. Accept repeated digits (e.g. 8888888888 is format-valid)
 * 6. Disallow pasting into phone inputs (users must manually type)
 * 7. Support optional phone numbers (empty is allowed when optional)
 */

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates whether a phone number is a valid 10-digit Indian mobile number.
 * @param phone The phone string to validate
 * @param isOptional If true, empty / whitespace strings are considered valid
 */
export function validateIndianMobile(phone: string, isOptional: boolean = false): ValidationResult {
  const trimmed = (phone || '').trim();

  if (!trimmed) {
    if (isOptional) {
      return { isValid: true };
    }
    return { isValid: false, error: 'Mobile number is required.' };
  }

  // Check for foreign country codes or prefixes
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    return { isValid: false, error: 'Do not include country prefix (+91). Enter 10 digits only.' };
  }

  // Check for non-digits
  if (/[^\d]/.test(trimmed)) {
    return { isValid: false, error: 'Only numeric digits (0–9) are allowed.' };
  }

  // Check length
  if (trimmed.length < 10) {
    if (!/^[6-9]/.test(trimmed)) {
      return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' };
    }
    return { isValid: false, error: 'Please enter a complete 10-digit mobile number.' };
  }

  if (trimmed.length > 10) {
    return { isValid: false, error: 'Mobile number cannot exceed 10 digits.' };
  }

  // Check starting digit (6, 7, 8, or 9)
  if (!/^[6-9]/.test(trimmed)) {
    return { isValid: false, error: 'Indian mobile numbers must start with 6, 7, 8, or 9.' };
  }

  return { isValid: true };
}

/**
 * Returns true if the string is exactly a valid 10-digit Indian mobile number.
 */
export function isValidIndianMobile(phone: string): boolean {
  return INDIAN_MOBILE_REGEX.test((phone || '').trim());
}

/**
 * Extracts 10 digits from an existing stored phone (e.g. if stored as +91XXXXXXXXXX).
 */
export function extract10DigitPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits.slice(0, 10);
}

/**
 * Validates an optional alternative phone number:
 * - Empty string is valid (optional field).
 * - If provided, must be exactly 10 digits starting with 6, 7, 8, or 9.
 * - Must be different from the primary phone number.
 */
export function validateAlternativePhone(
  altPhone: string,
  primaryPhone?: string
): ValidationResult {
  const trimmed = (altPhone || '').trim();

  if (!trimmed) {
    return { isValid: true };
  }

  const baseValidation = validateIndianMobile(trimmed, true);
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  // Ensure alt phone is different from primary phone
  const cleanPrimary = extract10DigitPhone(primaryPhone);
  const cleanAlt = extract10DigitPhone(trimmed);
  if (cleanPrimary && cleanAlt && cleanPrimary === cleanAlt) {
    return {
      isValid: false,
      error: 'Alternative phone number cannot be the same as primary phone number.',
    };
  }

  return { isValid: true };
}

/**
 * Keydown handler to restrict typing to 0-9 digits and control keys.
 * Blocks non-digit characters, paste shortcuts (Ctrl+V / Cmd+V), and 11th digit.
 */
export function handlePhoneKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  onPasteBlocked?: () => void
) {
  // Allow navigation / editing keys
  if (
    [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ].includes(e.key)
  ) {
    return;
  }

  // Handle Ctrl/Cmd combinations
  if (e.ctrlKey || e.metaKey) {
    // Disallow paste shortcut (Ctrl+V / Cmd+V) to enforce manual typing
    if (e.key.toLowerCase() === 'v') {
      e.preventDefault();
      onPasteBlocked?.();
      return;
    }
    // Allow other shortcuts like Ctrl+A, Ctrl+C
    return;
  }

  // Block any non-numeric key
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    return;
  }

  // Stop accepting input after 10 digits (if no text selected to overwrite)
  const target = e.currentTarget;
  const hasSelection =
    target.selectionStart !== null &&
    target.selectionEnd !== null &&
    target.selectionStart !== target.selectionEnd;

  if (target.value.length >= 10 && !hasSelection) {
    e.preventDefault();
  }
}
