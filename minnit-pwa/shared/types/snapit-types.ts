/**
 * snapit-types.ts — Shared contract for all three SnapIt apps.
 *
 * IMPORTANT: This file is the single source of truth for data shapes.
 * - Customer App (Vishva): reads Product, CartItem, Order
 * - Merchant App (Baav):   reads Order, updates OrderStatus
 * - Rider App (Suresh):    reads Order, updates OrderStatus (PICKED_UP, DELIVERED)
 *
 * ALL prices are stored as INTEGER PAISE to avoid JS floating-point errors.
 * e.g. ₹149 is stored as 14900. Use the formatCurrency() util to display.
 */

// ─── Product ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;           // UUID — never sequential
  name: string;
  price: number;        // Integer Paise ONLY (₹149 → 14900)
  imageUrl: string;
  storeId: string;
  category: ProductCategory;
  deliveryEtaMinutes: number;
  inStock: boolean;
}

export type ProductCategory = 'grocery' | 'food' | 'bakery' | 'pharmacy' | 'flowers';

// ─── Store ───────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  logoUrl: string;
  rating: number;       // 0.0 – 5.0
  category: ProductCategory;
  isOpen: boolean;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  quantity: number;     // Always a positive integer
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'           // Customer placed order, waiting for merchant
  | 'PLACED'            // Alias for PENDING — used in rider dispatch flow
  | 'PAID'              // Payment confirmed (backend-verified)
  | 'ACCEPTED'          // Merchant accepted
  | 'PREPARING'         // Merchant is preparing the order
  | 'READY'             // Ready for pickup (legacy alias)
  | 'READY_FOR_PICKUP'  // Triggers rider dispatch chime
  | 'RIDER_ASSIGNED'    // A specific rider has been assigned
  | 'PICKED_UP'         // Rider has collected from store
  | 'OUT_FOR_DELIVERY'  // Rider en-route to customer doorstep
  | 'DELIVERED'         // Order delivered — requires 4-digit PIN handshake
  | 'CANCELLED';        // Order cancelled

export type PaymentMethod = 'UPI_NOW' | 'UPI_DELIVERY' | 'CASH';

export interface Order {
  id: string;               // UUID
  customerId: string;       // Links to Firebase/Supabase user UID
  storeId: string;
  riderId?: string;         // Assigned after RIDER_ASSIGNED
  status: OrderStatus;
  items: CartItem[];
  estimatedTotal: number;   // Paise — for DISPLAY only, never trust for payment
  deliveryAddress: DeliveryAddress;
  cookingInstructions?: string;
  idempotencyKey: string;   // Client-generated UUID, sent with Pay action
  createdAt: string;        // ISO 8601 timestamp
  updatedAt: string;        // ISO 8601 timestamp

  // ── Rider Handshake & Payment Fields ───────────────────────────────────────
  paymentMethod?: PaymentMethod;            // UPI_NOW (paid), UPI_DELIVERY (doorstep QR), CASH (disabled Phase 1)
  deliveryVerified?: boolean;               // Set true on valid 4-digit PIN handshake
  recipientName?: string;                   // If ordering for someone else
  recipientPhone?: string;                  // Rider calls this number instead of customerId's phone
  deliveryAddressSnapshot?: DeliveryAddress; // Immutable snapshot at order-placement time
  handshakePinHash?: string;               // Hashed 4-digit OTP — NEVER store plaintext
}

// ─── Address ─────────────────────────────────────────────────────────────────

export interface DeliveryAddress {
  label: 'Home' | 'Work' | 'Other';
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

// ─── User / Auth ─────────────────────────────────────────────────────────────

export interface SnapItUser {
  uid: string;
  phone: string;
  name?: string;
  role: 'customer' | 'merchant' | 'rider';
}

// ─── Merchant ────────────────────────────────────────────────────────────────

export interface Merchant extends SnapItUser {
  role: 'merchant';
  storeId: string;
  storeName: string;
}

// ─── Rider ───────────────────────────────────────────────────────────────────

export type KycStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface Rider extends SnapItUser {
  role: 'rider';
  isOnline: boolean;
  currentOrderId?: string;

  // ── Rider Profile & Gamification ────────────────────────────────────────────
  vehicleNumber?: string;          // e.g. 'KA 07 AB 1234'
  dailyDeliveryCount: number;      // Resets at midnight — drives gamification header
  kycStatus: KycStatus;            // Document verification state (snapit-kyc Supabase bucket)
  upiId?: string;                  // Rider's personal UPI ID for doorstep QR generation
}