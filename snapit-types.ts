// ---------------------------------------------------------
// SNAPIT GLOBAL TYPES CONTRACT (USE EXACTLY AS WRITTEN)
// ---------------------------------------------------------

// 1. THE STATUS ENUM (Critical for real-time tracking)
export type OrderStatus = 
  | 'PENDING'       // Customer placed it, waiting for payment/shop
  | 'PAID'          // Payment successful (Online only)
  | 'ACCEPTED'      // Shop accepted the order
  | 'READY'         // Food/Items are packed and ready for pickup
  | 'PICKED_UP'     // Rider has collected the package
  | 'DELIVERED'     // Rider delivered to customer
  | 'CANCELLED';    // Order cancelled by shop or admin

// 2. THE ORDER OBJECT (How it looks in the database)
export interface Order {
  id: string;                 // UUID (e.g., 'aB3x9kLp...')
  displayId: string;          // 4-digit short code for riders/shops (e.g., '4829')
  customerId: string;         // Links to the user
  storeId: string;            // Links to the shop
  riderId: string | null;     // Null until a rider accepts it
  status: OrderStatus;        // Must be one of the Enums above
  items: CartItem[];          // Array of items ordered
  estimatedTotal: number;     // STORED IN PAISE (e.g., ₹150 = 15000)
  deliveryAddress: Address;   // Snapshot of where it is going
  createdAt: string;          // ISO Timestamp
}

// 3. THE CART ITEM OBJECT
export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;          // Price at the time of order (in Paise)
}

// 4. THE ADDRESS OBJECT
export interface Address {
  lat: number;
  lng: number;
  fullAddress: string;
  landmark: string;
  pinCode: string;
}