/**
 * Minnit PWA — Centralized Minnit ID Generator
 * Location: common_logic/idGenerator.ts
 *
 * SINGLE SOURCE OF TRUTH for all public human-readable ID generation across:
 *   - MU-XXXXXX  →  Minnit User (Customer)
 *   - MM-HUB-XXXXXX  →  Minnit Merchant Store
 *   - MR-XXXXXX  →  Minnit Rider
 *   - OD-YYMMDD-XXXXX  →  Order Display ID
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DESIGN DECISIONS (Do NOT change without team discussion):
 *
 * 1. SCRAMBLED SEQUENCE (Anti-Enumeration):
 *    IDs use a mathematical bijective scrambler (coprime modular mapping)
 *    so sequential internal counters (1, 2, 3...) produce visually random
 *    output (741020, 381942, 925407). Competitors cannot deduce your total
 *    user count or growth rate from any ID.
 *
 * 2. SINGLE ID (No UUID + Public ID split):
 *    These generated codes ARE the primary keys in Supabase tables.
 *    No translation layer needed. Search by MU-741020 directly in DB.
 *
 * 3. HUB CODE in Merchant & Store IDs only:
 *    - Stores/Merchants are fixed to a physical location → include hub.
 *    - Riders and Customers are mobile → no hub in ID, location is a DB column.
 *
 * 4. NEVER RECYCLE:
 *    Sequences only go forward. Even if a rider/customer/merchant leaves,
 *    their ID is permanently retired. Their DB record is marked INACTIVE.
 *
 * 5. Starting Offset = 100001:
 *    IDs start at 100001 so ALL IDs are always exactly 6 digits.
 *    Eliminates voice-support confusion from leading zeros.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─── 1. SCRAMBLER CONSTANTS ───────────────────────────────────────────────────
// These are co-prime to 900_000 (the 6-digit space: 100001 to 999999).
// NEVER change these after going live — existing IDs will break.
// Independently chosen per entity type for extra unpredictability.

const SCRAMBLER = {
  USER: {
    multiplier: 682_801,
    offset: 271_828,
    space: 900_000,     // 100001–999999
    start: 100_001,
  },
  MERCHANT: {
    multiplier: 410_051,
    offset: 314_159,
    space: 900_000,
    start: 100_001,
  },
  RIDER: {
    multiplier: 573_901,
    offset: 161_803,
    space: 900_000,
    start: 100_001,
  },
  ORDER: {
    multiplier: 741_301,
    offset: 271_828,
    space: 90_000,      // 10001–99999 (5-digit daily sequence)
    start: 10_001,
  },
} as const;

// ─── 2. CORE BIJECTIVE SCRAMBLE FUNCTION ─────────────────────────────────────

/**
 * Maps a sequential integer (1, 2, 3...) to a unique, pseudo-random integer
 * within the given space. Guaranteed collision-free within the space.
 *
 * This is the same mathematical principle used by URL shorteners and
 * anti-enumeration ID systems at Stripe, Shopify, and Razorpay.
 *
 * @param seq     Internal auto-increment counter from database (starts at 1)
 * @param multi   Coprime multiplier constant (must be coprime to space)
 * @param off     Offset salt constant
 * @param space   Total ID range size (e.g., 900_000 for 6-digit IDs)
 * @param start   Minimum output value (e.g., 100_001)
 */
function scramble(
  seq: number,
  multi: number,
  off: number,
  space: number,
  start: number,
): number {
  return start + ((seq * multi + off) % space);
}

// ─── 3. USER ID (Customer) ────────────────────────────────────────────────────
// Format:  MU-XXXXXX
// Example: MU-741020
// DB Table: profiles
// DB Column to add: minnit_id TEXT UNIQUE (replace old phone-as-id pattern)

/**
 * Generates a scrambled Minnit User ID for a customer.
 *
 * @param seq  Auto-increment sequence from DB (profiles_id_seq or similar)
 * @returns    Formatted ID string, e.g. "MU-741020"
 *
 * @example
 *   generateUserId(1)   → "MU-954629"
 *   generateUserId(2)   → "MU-737430"
 *   generateUserId(100) → "MU-181929"
 */
export function generateUserId(seq: number): string {
  const { multiplier, offset, space, start } = SCRAMBLER.USER;
  const code = scramble(seq, multiplier, offset, space, start);
  return `MU-${code}`;
}

// ─── 4. MERCHANT (STORE) ID ───────────────────────────────────────────────────
// Format:  MM-[HUB]-XXXXXX
// Example: MM-KGF-381942
// DB Table: merchants (or stores, whichever holds the shop record)
// DB Column to add: minnit_id TEXT UNIQUE
// NOTE: HUB = physical city/town where the store operates. Immutable after set.
// Category (GROCERY/DAIRY etc.) is always a separate DB column, NEVER in the ID.

/**
 * Generates a scrambled Minnit Merchant Store ID.
 *
 * @param seq  Auto-increment sequence from DB
 * @param hub  City/town code for the store's physical location (e.g. "KGF", "BLR")
 * @returns    Formatted ID string, e.g. "MM-KGF-381942"
 *
 * @example
 *   generateMerchantId(1, "KGF")  → "MM-KGF-610210"
 *   generateMerchantId(2, "KGF")  → "MM-KGF-120261"
 *   generateMerchantId(1, "BLR")  → "MM-BLR-610210"
 */
export function generateMerchantId(seq: number, hub: string): string {
  const { multiplier, offset, space, start } = SCRAMBLER.MERCHANT;
  const code = scramble(seq, multiplier, offset, space, start);
  return `MM-${hub.toUpperCase()}-${code}`;
}

// ─── 5. RIDER ID ─────────────────────────────────────────────────────────────
// Format:  MR-XXXXXX
// Example: MR-819205
// DB Table: rider_profiles
// DB Column to add: minnit_id TEXT UNIQUE
// NOTE: NO hub/city in rider ID — riders are mobile. Their current operating
//       zone is stored in rider_profiles.current_zone_id (updateable column).

/**
 * Generates a scrambled Minnit Rider ID.
 *
 * @param seq  Auto-increment sequence from DB (rider_profiles_id_seq or similar)
 * @returns    Formatted ID string, e.g. "MR-819205"
 *
 * @example
 *   generateRiderId(1)  → "MR-834904"
 *   generateRiderId(2)  → "MR-508707"
 *   generateRiderId(50) → "MR-319254"
 */
export function generateRiderId(seq: number): string {
  const { multiplier, offset, space, start } = SCRAMBLER.RIDER;
  const code = scramble(seq, multiplier, offset, space, start);
  return `MR-${code}`;
}

// ─── 6. ORDER DISPLAY ID ─────────────────────────────────────────────────────
// Format:  OD-[YYMMDD]-[XXXXX]
// Example: OD-261003-49182
// DB Table: orders
// DB Column to add: display_id TEXT UNIQUE
// NOTE: The sequence resets daily. The date prefix ensures global uniqueness
//       across days. The 5-digit scrambled number hides daily order volume.

/**
 * Generates a scrambled Minnit Order Display ID.
 *
 * @param dailySeq  Daily auto-increment sequence (resets at midnight)
 * @param date      Optional Date object. Defaults to today (IST).
 * @returns         Formatted ID string, e.g. "OD-261003-49182"
 *
 * @example
 *   generateOrderId(1)   → "OD-261003-84929"  (hides that it's order #1 today)
 *   generateOrderId(2)   → "OD-261003-25830"
 *   generateOrderId(100) → "OD-261003-13529"
 */
export function generateOrderId(dailySeq: number, date?: Date): string {
  const d = date ?? new Date();

  // Format as YYMMDD in IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + istOffset);
  const yy = String(ist.getUTCFullYear()).slice(2);
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  const { multiplier, offset, space, start } = SCRAMBLER.ORDER;
  const code = scramble(dailySeq, multiplier, offset, space, start);
  return `OD-${dateStr}-${code}`;
}

// ─── 7. VALIDATION HELPERS ───────────────────────────────────────────────────

/** Returns true if the string looks like a valid Minnit User ID */
export function isValidUserId(id: string): boolean {
  return /^MU-\d{6}$/.test(id);
}

/** Returns true if the string looks like a valid Minnit Merchant ID */
export function isValidMerchantId(id: string): boolean {
  return /^MM-[A-Z]{2,6}-\d{6}$/.test(id);
}

/** Returns true if the string looks like a valid Minnit Rider ID */
export function isValidRiderId(id: string): boolean {
  return /^MR-\d{6}$/.test(id);
}

/** Returns true if the string looks like a valid Minnit Order ID */
export function isValidOrderId(id: string): boolean {
  return /^OD-\d{6}-\d{5}$/.test(id);
}

/** Extracts entity type from any Minnit ID prefix */
export function getEntityType(id: string): 'USER' | 'MERCHANT' | 'RIDER' | 'ORDER' | 'UNKNOWN' {
  if (id.startsWith('MU-')) return 'USER';
  if (id.startsWith('MM-')) return 'MERCHANT';
  if (id.startsWith('MR-')) return 'RIDER';
  if (id.startsWith('OD-')) return 'ORDER';
  return 'UNKNOWN';
}
