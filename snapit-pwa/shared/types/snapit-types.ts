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
  | 'PENDING'     // Customer placed order, waiting for merchant
  | 'PAID'        // Payment confirmed (backend-verified)
  | 'ACCEPTED'    // Merchant accepted
  | 'PREPARING'   // Merchant is preparing the order
  | 'READY'       // Ready for pickup by rider
  | 'PICKED_UP'   // Rider has collected the order
  | 'DELIVERED'   // Order delivered to customer
  | 'CANCELLED';  // Order cancelled

export interface Order {
  id: string;               // UUID
  customerId: string;       // Links to Firebase/Supabase user UID
  storeId: string;
  riderId?: string;         // Assigned after ACCEPTED
  status: OrderStatus;
  items: CartItem[];
  estimatedTotal: number;   // Paise — for DISPLAY only, never trust for payment
  deliveryAddress: DeliveryAddress;
  cookingInstructions?: string;
  idempotencyKey: string;   // Client-generated UUID, sent with Pay action
  createdAt: string;        // ISO 8601 timestamp
  updatedAt: string;        // ISO 8601 timestamp
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

export interface Rider extends SnapItUser {
  role: 'rider';
  isOnline: boolean;
  currentOrderId?: string;
}