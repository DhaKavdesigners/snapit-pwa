export interface Product {
  id: string; // UUID, never sequential
  name: string;
  price: number; // Stored strictly as Integer Paise (e.g., ₹100 = 10000)
  imageUrl: string;
  storeId: string;
  category: 'grocery' | 'food' | 'bakery';
  deliveryEtaMinutes: number;
  inStock: boolean;
}

export interface Store {
  id: string;
  name: string;
  logoUrl: string;
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
  status: 'PENDING' | 'PAID' | 'ACCEPTED' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  items: CartItem[];
  estimatedTotal: number; // Stored in Paise
  createdAt: string;
}
