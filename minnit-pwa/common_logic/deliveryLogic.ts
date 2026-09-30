/**
 * SnapIt Quick-Commerce - Centralized Shared Delivery & OTP Logic
 * Location: common_logic/deliveryLogic.ts
 *
 * This is the SINGLE SOURCE OF TRUTH for:
 * 1. Delivery Fee Calculation (Customer Cart, Checkout & Rider Payout)
 * 2. 4-Digit Handshake PIN/OTP Generation & Verification
 *
 * In the future, distance-based pricing, surge pricing, or store-specific rates
 * should be updated directly in this file.
 */

// ─── 1. PRICING CONFIGURATION ──────────────────────────────────────────────────

export const DELIVERY_PRICING_CONFIG = {
  /** Default base delivery fee in Rupees */
  baseFeeRupees: 30,

  /** Base distance included in base fee (in Kilometers) */
  baseDistanceKm: 3.0,

  /** Additional fee per extra km beyond base distance */
  perKmRateRupees: 5,

  /** Minimum delivery fee in Rupees */
  minFeeRupees: 25,

  /** Maximum delivery fee cap in Rupees */
  maxFeeRupees: 60,

  /** Free delivery threshold in Rupees (0 = disabled) */
  freeDeliveryThresholdRupees: 0,
};

// ─── 2. DELIVERY FEE CALCULATION ───────────────────────────────────────────────

export interface CalculateFeeParams {
  distanceKm?: number;
  subtotalRupees?: number;
  storeId?: string;
}

export interface DeliveryFeeResult {
  feeRupees: number;
  feePaise: number;
  distanceKm: number;
  isFreeDelivery: boolean;
}

/**
 * Calculates the exact delivery fee for an order.
 * Used by Customer App (Cart & Checkout) and Rider App (Payout).
 *
 * @param params Optional distance, subtotal, and store ID
 * @returns DeliveryFeeResult with fee in Rupees and Paise
 */
export function calculateDeliveryFee(params?: CalculateFeeParams): DeliveryFeeResult {
  const distanceKm = params?.distanceKm || 2.4;
  const subtotal = params?.subtotalRupees || 0;

  // Check free delivery eligibility
  if (
    DELIVERY_PRICING_CONFIG.freeDeliveryThresholdRupees > 0 &&
    subtotal >= DELIVERY_PRICING_CONFIG.freeDeliveryThresholdRupees
  ) {
    return {
      feeRupees: 0,
      feePaise: 0,
      distanceKm,
      isFreeDelivery: true,
    };
  }

  // Distance-based dynamic fee calculation
  let computedFee = DELIVERY_PRICING_CONFIG.baseFeeRupees;

  if (distanceKm > DELIVERY_PRICING_CONFIG.baseDistanceKm) {
    const extraKm = distanceKm - DELIVERY_PRICING_CONFIG.baseDistanceKm;
    computedFee += Math.ceil(extraKm * DELIVERY_PRICING_CONFIG.perKmRateRupees);
  }

  // Clamp within min and max caps
  computedFee = Math.max(
    DELIVERY_PRICING_CONFIG.minFeeRupees,
    Math.min(computedFee, DELIVERY_PRICING_CONFIG.maxFeeRupees)
  );

  return {
    feeRupees: computedFee,
    feePaise: computedFee * 100,
    distanceKm,
    isFreeDelivery: false,
  };
}

// ─── 3. DELIVERY PIN / OTP LOGIC ──────────────────────────────────────────────

export interface DeliveryPinResult {
  pinString: string;
  pinNumber: number;
}

/**
 * Generates a consistent 4-digit Delivery Handshake PIN.
 *
 * @param orderId Optional order ID to derive a deterministic PIN from
 * @returns 4-digit PIN formatted as string and number
 */
export function generateDeliveryPin(orderId?: string): DeliveryPinResult {
  let pinStr = '';

  if (orderId) {
    const digits = orderId.replace(/\D/g, '');
    if (digits.length >= 4) {
      pinStr = digits.slice(-4);
    }
  }

  if (!pinStr || pinStr.length !== 4) {
    pinStr = String(Math.floor(1000 + Math.random() * 9000));
  }

  return {
    pinString: pinStr,
    pinNumber: Number(pinStr),
  };
}

/**
 * Validates the 4-digit PIN entered by the rider upon delivery.
 *
 * @param enteredPin The 4 digits entered by the rider
 * @param expectedPin The PIN stored on the order in Supabase
 * @returns boolean true if valid match
 */
export function verifyDeliveryPin(
  enteredPin: string,
  expectedPin: string | number | undefined | null
): boolean {
  if (!enteredPin || enteredPin.length !== 4) return false;
  if (!expectedPin) return false;

  const normalizedExpected = String(expectedPin).trim().padStart(4, '0');
  const normalizedEntered = String(enteredPin).trim();

  return normalizedEntered === normalizedExpected;
}
