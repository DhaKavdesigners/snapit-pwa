/**
 * snapit-types.ts — Shared contract for SnapIt Merchant Dashboard.
 * Localized within merchant-app to preserve workspace boundary safety.
 *
 * ALL prices are stored as INTEGER PAISE to avoid JS floating-point errors.
 * e.g. ₹149 is stored as 14900. Use formatCurrency() to display.
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

export type ProductCategory = 'grocery' | 'food' | 'bakery' | 'pharmacy' | 'flowers' | (string & {});

// ─── Store ───────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  logoUrl: string;
  rating: number;       // 0.0 – 5.0
  category: ProductCategory;
  isOpen: boolean;
  address?: string;
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
  | 'OUT_OF_SHOP'       // Merchant handed order to rider, waiting for rider ack
  | 'PICKED_UP'         // Alias for OUT_FOR_DELIVERY
  | 'OUT_FOR_DELIVERY'  // Rider confirmed receipt, en-route to customer
  | 'RIDER_AT_LOC'      // Rider reached customer delivery location
  | 'DELIVERED'         // Order delivered — requires 4-digit PIN handshake
  | 'CANCELLED';        // Order cancelled

export type PaymentMethod = 'UPI_NOW' | 'UPI_DELIVERY' | 'CASH';

export interface Order {
  id: string;               // UUID / #6999
  customerId: string;       // Links to user UID
  storeId: string;
  riderId?: string;         // Assigned after RIDER_ASSIGNED
  status: OrderStatus;
  items: CartItem[];
  estimatedTotal: number;   // Integer Paise
  deliveryAddress: DeliveryAddress;
  cookingInstructions?: string;
  idempotencyKey: string;   // Client-generated UUID
  createdAt: string;        // ISO 8601 timestamp
  updatedAt: string;        // ISO 8601 timestamp

  // ── Rider Handshake & Payment Fields ───────────────────────────────────────
  paymentMethod?: PaymentMethod;            // UPI_NOW (paid), UPI_DELIVERY (doorstep QR), CASH
  deliveryVerified?: boolean;               // Set true on valid 4-digit PIN handshake
  recipientName?: string;                   // Customer name
  recipientPhone?: string;                  // Customer phone
  deliveryAddressSnapshot?: DeliveryAddress; // Immutable snapshot at order-placement time
  handshakePinHash?: string;               // Hashed 4-digit OTP
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
  vehicleNumber?: string;
  dailyDeliveryCount: number;
  kycStatus: KycStatus;
  upiId?: string;
}
