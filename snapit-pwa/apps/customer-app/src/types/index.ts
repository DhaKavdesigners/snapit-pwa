export interface Product {
  id: string; // UUID, never sequential
  name: string;
  price: number; // Stored strictly as Integer Paise (e.g., ₹100 = 10000)
  imageUrl: string; // Local path: /images/products/<name>.jpg
  fallbackImageUrl?: string; // Unsplash URL if local image not found
  storeId: string;
  category: 'grocery' | 'food' | 'bakery';
  subCategory?: string;
  deliveryEtaMinutes: number;
  inStock: boolean;
  stockCount?: number;
  description?: string;
  storeName?: string;
  storeIsOpen?: boolean;
}

export interface Store {
  id: string;
  name: string;
  logoUrl: string; // Local path: /images/stores/<store-slug>/logo.jpg
  fallbackLogoUrl?: string; // Unsplash URL if local logo not found
  rating: number;
  category: Product['category'];
  isOpen: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  status:
    | 'PENDING'
    | 'PLACED'
    | 'PAID'
    | 'ACCEPTED'
    | 'PREPARING'
    | 'RIDER_ARRIVING_TO_STORE'
    | 'RIDER_ASSIGNED'
    | 'READY'
    | 'READY_FOR_PICKUP'
    | 'OUT_OF_SHOP'
    | 'PICKED_UP'
    | 'OUT_FOR_DELIVERY'
    | 'RIDER_AT_LOC'
    | 'ARRIVED_AT_CUSTOMER'
    | 'DELIVERED'
    | 'CANCELLED';
  items: CartItem[];
  estimatedTotal: number; // Stored in Paise
  createdAt: string;
}
