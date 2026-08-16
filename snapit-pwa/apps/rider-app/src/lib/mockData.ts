/**
 * mockData.ts — KGF-specific mock data for Phase 1
 *
 * All prices in INTEGER PAISE. (₹100 = 10000)
 * All locations reference real KGF neighbourhoods.
 */

import type { Order, Rider } from '../../../../shared/types/snapit-types';

// ── Helpers ─────────────────────────────────────────────────────────────────

let _orderId = 1000;
export const nextOrderId = () => `ORD-${++_orderId}`;

export const now = () => new Date().toISOString();

/** Formats paise integer to ₹XX.XX display string */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`;
}

// ── Mock Rider Profile ───────────────────────────────────────────────────────

export const MOCK_RIDER: Rider = {
  uid: 'rider-suresh-001',
  phone: '+919876543210',
  name: 'Suresh Kumar',
  role: 'rider',
  isOnline: false,
  vehicleNumber: 'KA 07 EF 5591',
  dailyDeliveryCount: 0,
  kycStatus: 'VERIFIED',
  upiId: 'suresh.snapit@upi',
  currentOrderId: undefined,
};

// ── Mock Stores (KGF Locations) ──────────────────────────────────────────────

export const MOCK_STORES = [
  { id: 'store-001', name: 'Sri Lakshmi Provision Store', area: 'Robertsonpet', emoji: '🛒' },
  { id: 'store-002', name: 'KGF Bakery House', area: 'KGF Town', emoji: '🥐' },
  { id: 'store-003', name: 'Nandini Dairy Corner', area: 'Champapet', emoji: '🥛' },
  { id: 'store-004', name: 'Bharat Medical Hall', area: 'Oorgaum', emoji: '💊' },
  { id: 'store-005', name: 'Annapoorna Hotel', area: 'Marikuppam', emoji: '🍱' },
];

// ── Mock Customer Addresses (KGF Localities) ─────────────────────────────────

export const MOCK_ADDRESSES = [
  { label: 'Home' as const, line1: '14, 3rd Cross, VSG Layout', line2: 'Near Water Tank', city: 'Robertsonpet', pincode: '563115', lat: 12.9578, lng: 78.2732 },
  { label: 'Home' as const, line1: '7, BGM Colony, 2nd Street', city: 'KGF Town', pincode: '563113', lat: 12.9501, lng: 78.2718 },
  { label: 'Work' as const, line1: '22, Industrial Estate Road', line2: 'Opp. KGFCL Gate', city: 'Oorgaum', pincode: '563118', lat: 12.9456, lng: 78.2819 },
  { label: 'Home' as const, line1: '5/A, Champapet Main Road', city: 'Champapet', pincode: '563116', lat: 12.9632, lng: 78.2751 },
];

// ── Mock Incoming Orders ─────────────────────────────────────────────────────

export const MOCK_INCOMING_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    customerId: 'cust-001',
    storeId: 'store-001',
    status: 'READY_FOR_PICKUP',
    items: [
      { productId: 'p-001', quantity: 2 },
      { productId: 'p-002', quantity: 1 },
      { productId: 'p-003', quantity: 3 },
    ],
    estimatedTotal: 28500,  // ₹285 in paise
    deliveryAddress: MOCK_ADDRESSES[0],
    deliveryAddressSnapshot: MOCK_ADDRESSES[0],
    paymentMethod: 'UPI_NOW',
    cookingInstructions: 'Please handle eggs carefully',
    idempotencyKey: 'idem-1001',
    handshakePinHash: '1234', // Phase 1: plaintext pin for mock
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-1002',
    customerId: 'cust-002',
    storeId: 'store-005',
    status: 'READY_FOR_PICKUP',
    items: [
      { productId: 'f-001', quantity: 1 },
      { productId: 'f-002', quantity: 2 },
    ],
    estimatedTotal: 34000,  // ₹340 in paise
    deliveryAddress: MOCK_ADDRESSES[1],
    deliveryAddressSnapshot: MOCK_ADDRESSES[1],
    paymentMethod: 'UPI_DELIVERY',
    recipientName: 'Meera Devi',
    recipientPhone: '+919845123456',
    idempotencyKey: 'idem-1002',
    handshakePinHash: '7391',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
];

// ── Mock order for active delivery tracking ──────────────────────────────────

export const MOCK_ACTIVE_ORDER: Order = {
  id: 'ORD-1000',
  customerId: 'cust-000',
  storeId: 'store-002',
  riderId: 'rider-suresh-001',
  status: 'OUT_FOR_DELIVERY',
  items: [
    { productId: 'b-001', quantity: 2 },
    { productId: 'b-002', quantity: 1 },
  ],
  estimatedTotal: 15500,  // ₹155 in paise
  deliveryAddress: MOCK_ADDRESSES[2],
  deliveryAddressSnapshot: MOCK_ADDRESSES[2],
  paymentMethod: 'UPI_DELIVERY',
  handshakePinHash: '4521',
  idempotencyKey: 'idem-1000',
  createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
};

// ── Store metadata lookup ────────────────────────────────────────────────────

export function getStoreMeta(storeId: string) {
  return MOCK_STORES.find((s) => s.id === storeId) ?? {
    id: storeId,
    name: 'Unknown Store',
    area: 'KGF',
    emoji: '🏪',
  };
}

// ── Item name lookup (Phase 1 mock) ─────────────────────────────────────────

const MOCK_ITEM_NAMES: Record<string, { name: string; price: number }> = {
  'p-001': { name: 'Aashirvaad Atta 5kg',       price: 28500 },
  'p-002': { name: 'Amul Butter 500g',           price: 26000 },
  'p-003': { name: 'Farm Eggs (Tray/30)',         price: 24000 },
  'f-001': { name: 'Meals (Rice + 2 Curries)',   price: 12000 },
  'f-002': { name: 'Ragi Mudde (2 pcs)',         price: 5000  },
  'b-001': { name: 'Cream Bun (2 pcs)',          price: 4000  },
  'b-002': { name: 'Ghee Cake Slice',            price: 7500  },
};

export function getItemName(productId: string): string {
  return MOCK_ITEM_NAMES[productId]?.name ?? `Item (${productId})`;
}

export function getItemPrice(productId: string): number {
  return MOCK_ITEM_NAMES[productId]?.price ?? 0;
}

// ── Time helpers ─────────────────────────────────────────────────────────────

export function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export function estimatedEarning(totalPaise: number): string {
  // Rider earns 12% of order value (mock rate)
  const earning = Math.floor(totalPaise * 0.12);
  return formatCurrency(earning);
}
