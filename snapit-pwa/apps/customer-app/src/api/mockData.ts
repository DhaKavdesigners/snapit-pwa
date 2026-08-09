import { Product, Store } from '../types';

export const mockShoppingStores: Store[] = [
  { id: 's1', name: 'Fresh Mart', logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100&h=100&fit=crop', rating: 4.5, category: 'grocery', isOpen: true },
  { id: 's2', name: 'Daily Essentials', logoUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100&h=100&fit=crop', rating: 4.2, category: 'grocery', isOpen: true },
];

export const mockFoodStores: Store[] = [
  { id: 'f1', name: 'Biryani House', logoUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&h=100&fit=crop', rating: 4.8, category: 'food', isOpen: true },
  { id: 'f2', name: 'Burger Joint', logoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&h=100&fit=crop', rating: 4.1, category: 'food', isOpen: true },
];

export const mockShoppingProducts: Product[] = [
  { id: 'p1', name: 'Farm Fresh Milk 1L', price: 6500, imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop', storeId: 's1', category: 'grocery', deliveryEtaMinutes: 10, inStock: true },
  { id: 'p2', name: 'Whole Wheat Bread', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop', storeId: 's1', category: 'bakery', deliveryEtaMinutes: 10, inStock: true },
  { id: 'p3', name: 'Organic Eggs (6 pack)', price: 5500, imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=200&h=200&fit=crop', storeId: 's2', category: 'grocery', deliveryEtaMinutes: 15, inStock: true },
];

export const mockFoodProducts: Product[] = [
  { id: 'p4', name: 'Chicken Dum Biryani', price: 25000, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop', storeId: 'f1', category: 'food', deliveryEtaMinutes: 30, inStock: true },
  { id: 'p5', name: 'Classic Cheeseburger', price: 14900, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', storeId: 'f2', category: 'food', deliveryEtaMinutes: 25, inStock: true },
];
