import type { Store, Product, Order, Merchant } from '../types/snapit-types';

export interface ProductInventoryItem extends Product {
  stockCount: number;
  availability: 'AVAILABLE' | 'OUT OF STOCK' | 'UNLISTED';
  description?: string;
}

export interface HistoricalDateGroup {
  dateKey: string; // e.g. "30-Jul-2026 Thursday"
  orderCount: number;
  collectedPaise: number;
  rejectedCount: number;
  lostPaise: number;
  orders: Order[];
}

export const mockMerchants: Merchant[] = [
  {
    uid: 'm_albaik',
    name: 'Mohammed Irfan',
    phone: '+91 98450 12345',
    role: 'merchant',
    storeId: 'f4',
    storeName: 'Al Baik KGF',
  },
  {
    uid: 'm_mhetha',
    name: 'Sanjay Mhetha',
    phone: '+91 99001 23456',
    role: 'merchant',
    storeId: 's1',
    storeName: 'Mhetha Stores',
  },
  {
    uid: 'm_ambur',
    name: 'Kareem Pasha',
    phone: '+91 97412 34567',
    role: 'merchant',
    storeId: 'f3',
    storeName: 'Ambur Biriyani KGF',
  },
  {
    uid: 'm_nandhini',
    name: 'Ramesh Kumar',
    phone: '+91 94480 87654',
    role: 'merchant',
    storeId: 's4',
    storeName: 'Nandhini KGF',
  },
];

export const mockStores: Store[] = [
  {
    id: 'f4',
    name: 'Al Baik KGF',
    logoUrl: '/images/stores/venus ambur biriyani.jpg',
    rating: 4.5,
    category: 'food',
    isOpen: false, // Default initial offline state as requested
  },
  {
    id: 's1',
    name: 'Mhetha Stores',
    logoUrl: '/images/stores/metha-stores.avif',
    rating: 4.5,
    category: 'grocery',
    isOpen: false,
  },
  {
    id: 'f3',
    name: 'Ambur Biriyani KGF',
    logoUrl: '/images/stores/venus ambur biriyani.jpg',
    rating: 4.8,
    category: 'food',
    isOpen: false,
  },
  {
    id: 's4',
    name: 'Nandhini KGF',
    logoUrl: '/images/stores/mhetha-stores/logo.jpg',
    rating: 4.9,
    category: 'grocery',
    isOpen: false,
  },
];

export const mockProductsByStore: Record<string, ProductInventoryItem[]> = {
  // AL BAIK KGF (Food Store with detailed categories)
  f4: [
    {
      id: 'ak01',
      name: 'Crispy Fried Chicken (1pc)',
      price: 17500, // ₹175
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80',
      storeId: 'f4',
      category: 'Fried Chicken',
      deliveryEtaMinutes: 15,
      inStock: true,
      stockCount: 100,
      availability: 'AVAILABLE',
      description: 'Signature crispy golden fried chicken drumstick seasoned with spicy herbs',
    },
    {
      id: 'ak02',
      name: 'Crispy Fried Chicken (3 Pcs Bucket)',
      price: 25000, // ₹250
      imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80',
      storeId: 'f4',
      category: 'Fried Chicken',
      deliveryEtaMinutes: 20,
      inStock: true,
      stockCount: 45,
      availability: 'AVAILABLE',
      description: '3 pieces hot & crispy fried chicken served with garlic dip',
    },
    {
      id: 'ak03',
      name: 'Classic Chicken Zinger Burger',
      price: 14000, // ₹140
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
      storeId: 'f4',
      category: 'Burgers',
      deliveryEtaMinutes: 15,
      inStock: true,
      stockCount: 60,
      availability: 'AVAILABLE',
      description: 'Crunchy chicken fillet topped with fresh lettuce & spicy mayo',
    },
    {
      id: 'ak04',
      name: 'Loaded Cheesy Fries',
      price: 9900, // ₹99
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
      storeId: 'f4',
      category: 'Sides & Fries',
      deliveryEtaMinutes: 10,
      inStock: true,
      stockCount: 80,
      availability: 'AVAILABLE',
      description: 'Crisp golden french fries loaded with melted cheese blend & herbs',
    },
    {
      id: 'ak05',
      name: 'Hot & Spicy Chicken Popcorn',
      price: 12000, // ₹120
      imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&auto=format&fit=crop&q=80',
      storeId: 'f4',
      category: 'Starters',
      deliveryEtaMinutes: 12,
      inStock: false,
      stockCount: 0,
      availability: 'OUT OF STOCK',
      description: 'Bite-sized tender boneless chicken tossed in fiery peri peri seasoning',
    },
    {
      id: 'ak06',
      name: 'Thums Up (300ml Can)',
      price: 4000, // ₹40
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80',
      storeId: 'f4',
      category: 'Beverages',
      deliveryEtaMinutes: 5,
      inStock: true,
      stockCount: 150,
      availability: 'AVAILABLE',
      description: 'Chilled carbonated soft drink',
    },
  ],

  // MHETHA STORES (Grocery Store with detailed categories)
  s1: [
    {
      id: 'ms01',
      name: 'Maggi 2-Minute Noodles (Pack of 2)',
      price: 2800, // ₹28
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
      storeId: 's1',
      category: 'Noodles & Snacks',
      deliveryEtaMinutes: 10,
      inStock: true,
      stockCount: 120,
      availability: 'AVAILABLE',
      description: '140 g Pack of 2 instant masala noodles',
    },
    {
      id: 'ms02',
      name: 'Fortune Sunflower Oil (1L Pouch)',
      price: 13500, // ₹135
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
      storeId: 's1',
      category: 'Edible Oils',
      deliveryEtaMinutes: 10,
      inStock: true,
      stockCount: 40,
      availability: 'AVAILABLE',
      description: '1 Litre refined sunflower pouch',
    },
    {
      id: 'ms03',
      name: 'Tata Tea Gold (250g)',
      price: 4500, // ₹45
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=80',
      storeId: 's1',
      category: 'Tea & Coffee',
      deliveryEtaMinutes: 10,
      inStock: true,
      stockCount: 65,
      availability: 'AVAILABLE',
      description: '250 g rich & aromatic tea blend',
    },
    {
      id: 'ms04',
      name: 'Aashirvaad Shudh Chakki Atta (5kg)',
      price: 24500, // ₹245
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
      storeId: 's1',
      category: 'Atta & Flours',
      deliveryEtaMinutes: 10,
      inStock: true,
      stockCount: 30,
      availability: 'AVAILABLE',
      description: '100% whole wheat grain flour with natural dietary fiber',
    },
    {
      id: 'ms05',
      name: 'Surf Excel Easy Wash (1kg)',
      price: 13000, // ₹130
      imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=80',
      storeId: 's1',
      category: 'Soaps & Detergents',
      deliveryEtaMinutes: 10,
      inStock: true,
      stockCount: 50,
      availability: 'AVAILABLE',
      description: 'Advanced stain removal washing powder',
    },
  ],

  // NANDHINI KGF (Daily Essentials & Dairy)
  s4: [
    {
      id: 'nd01',
      name: 'Nandini Pasteurised Toned Milk (500ml)',
      price: 2400, // ₹24
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
      storeId: 's4',
      category: 'Milk & Curd',
      deliveryEtaMinutes: 8,
      inStock: true,
      stockCount: 150,
      availability: 'AVAILABLE',
      description: 'Fresh daily pasteurized toned milk with 3.0% fat',
    },
    {
      id: 'nd02',
      name: 'Nandini Fresh Curd (500g Pouch)',
      price: 2500, // ₹25
      imageUrl: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=400&auto=format&fit=crop&q=80',
      storeId: 's4',
      category: 'Milk & Curd',
      deliveryEtaMinutes: 8,
      inStock: true,
      stockCount: 80,
      availability: 'AVAILABLE',
      description: 'Thick creamy pasteurized curd',
    },
    {
      id: 'nd03',
      name: 'Nandini Pure Cow Ghee (200ml)',
      price: 16500, // ₹165
      imageUrl: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&auto=format&fit=crop&q=80',
      storeId: 's4',
      category: 'Butter & Ghee',
      deliveryEtaMinutes: 8,
      inStock: true,
      stockCount: 40,
      availability: 'AVAILABLE',
      description: 'Aromatic granular traditional pure cow ghee',
    },
    {
      id: 'nd04',
      name: 'Nandini Fresh Paneer (200g)',
      price: 11000, // ₹110
      imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&auto=format&fit=crop&q=80',
      storeId: 's4',
      category: 'Paneer & Cheese',
      deliveryEtaMinutes: 8,
      inStock: true,
      stockCount: 35,
      availability: 'AVAILABLE',
      description: 'Soft and fresh cottage cheese vacuum packed',
    },
  ],

  // AMBUR BIRIYANI KGF (Restaurant Food)
  f3: [
    {
      id: 'ab01',
      name: 'Special Chicken Dum Biryani',
      price: 18000, // ₹180
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
      storeId: 'f3',
      category: 'Biryani Specials',
      deliveryEtaMinutes: 25,
      inStock: true,
      stockCount: 50,
      availability: 'AVAILABLE',
      description: 'Authentic seeraga samba rice cooked with tender spiced chicken & eggs',
    },
    {
      id: 'ab02',
      name: 'Chicken 65 (Boneless Starter)',
      price: 15000, // ₹150
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&auto=format&fit=crop&q=80',
      storeId: 'f3',
      category: 'Starters & Grills',
      deliveryEtaMinutes: 20,
      inStock: true,
      stockCount: 40,
      availability: 'AVAILABLE',
      description: 'Crispy deep fried chicken tossed with curry leaves & green chilies',
    },
    {
      id: 'ab03',
      name: 'Paneer Butter Masala (Gravy)',
      price: 16000, // ₹160
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80',
      storeId: 'f3',
      category: 'Veg Gravies',
      deliveryEtaMinutes: 20,
      inStock: true,
      stockCount: 30,
      availability: 'AVAILABLE',
      description: 'Rich tomato cashew gravy with soft paneer cubes',
    },
  ],
};

export const initialHistoricalGroups: HistoricalDateGroup[] = [
  {
    dateKey: 'Today (Live Activity)',
    orderCount: 0,
    collectedPaise: 0,
    rejectedCount: 0,
    lostPaise: 0,
    orders: [],
  },
];
