import { Product, Store } from '../types';

// Helper: returns local path with Unsplash fallback.
export function imgWithFallback(localPath: string, fallbackUrl: string) {
  return { src: localPath, fallback: fallbackUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// STORES
// ─────────────────────────────────────────────────────────────────────────────
export const mockShoppingStores: Store[] = [
  { id: 's1', name: 'Mhetha Stores',  logoUrl: '/images/stores/mhetha-stores/logo.jpg',        fallbackLogoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&h=200&fit=crop', rating: 4.5, category: 'grocery', isOpen: true },
  { id: 's2', name: 'Vishal Mart',    logoUrl: '/images/stores/vishal-mart/logo.jpg',           fallbackLogoUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200&h=200&fit=crop', rating: 4.2, category: 'grocery', isOpen: true },
  { id: 's3', name: 'RR Bazar',       logoUrl: '/images/stores/rr-bazar/logo.jpg',              fallbackLogoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200&h=200&fit=crop', rating: 4.6, category: 'grocery', isOpen: true },
  { id: 's4', name: 'Nandhini KGF',   logoUrl: '/images/stores/nandhini-kgf/logo.jpg',          fallbackLogoUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop', rating: 4.9, category: 'grocery', isOpen: true },
];

export const mockFoodStores: Store[] = [
  { id: 'f1', name: 'Bakio',               logoUrl: '/images/stores/bakio/logo.jpg',              fallbackLogoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop', rating: 4.7, category: 'food', isOpen: true },
  { id: 'f2', name: 'Mayura',              logoUrl: '/images/stores/mayura/logo.jpg',             fallbackLogoUrl: 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=200&h=200&fit=crop', rating: 4.4, category: 'food', isOpen: true },
  { id: 'f3', name: 'Ambur Biriyani KGF', logoUrl: '/images/stores/ambur-biriyani-kgf/logo.jpg', fallbackLogoUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=200&fit=crop', rating: 4.8, category: 'food', isOpen: true },
  { id: 'f4', name: 'Al Baik',            logoUrl: '/images/stores/al-baik/logo.jpg',            fallbackLogoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', rating: 4.5, category: 'food', isOpen: true },
  { id: 'f5', name: 'Al Naz',             logoUrl: '/images/stores/al-naz/logo.jpg',             fallbackLogoUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop', rating: 4.3, category: 'food', isOpen: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORE CATEGORIES CONFIGURATION (Refined per new structure)
// ─────────────────────────────────────────────────────────────────────────────
export const exploreCategories = [
  {
    id: 'cat_groceries',
    title: '🛒 Grocery',
    subCategories: [
      { id: 'sc_essentials', name: 'Everyday Essentials' },
      { id: 'sc_cooking', name: 'Cooking Essentials' },
      { id: 'sc_snacks', name: 'Snacks & Beverages' }
    ]
  },
  {
    id: 'cat_dairy',
    title: '🥛 Dairy & Chilled',
    subCategories: [
      { id: 'sc_milk', name: 'Milk & Curd' },
      { id: 'sc_butter', name: 'Butter, Ghee & Cream' },
      { id: 'sc_icecream', name: 'Ice Cream' }
    ]
  },
  {
    id: 'cat_home_care',
    title: '🧴 Personal & Home Care',
    subCategories: [
      { id: 'sc_personal', name: 'Personal Care' },
      { id: 'sc_home', name: 'Home Essentials' }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

// MHETHA STORES (Groceries)
const mhethaProducts: Product[] = [
  { id: 'ms01', name: 'Maggi 2-Minute Noodles',      price: 2800,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '140 g (Pack of 2) • Instant masala noodles', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/maggi-noodles.jpg',          fallbackImageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop' },
  { id: 'ms02', name: 'Fortune Sunflower Oil',        price: 13500, storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Everyday Essentials', description: '1 L Pouch • Refined sunflower oil',            deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/sunflower-oil.jpg',          fallbackImageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop' },
  { id: 'ms03', name: 'Tata Tea Gold',               price: 4500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '250 g • Strong & aromatic tea',                deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/tata-tea.jpg',              fallbackImageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=400&h=400&fit=crop' },
  { id: 'ms04', name: 'Parle-G Gold Biscuits',       price: 1000,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '450 g • Classic glucose biscuits',             deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/parle-g.jpg',               fallbackImageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop' },
  { id: 'ms05', name: 'Lays Classic Salted Chips',   price: 2000,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '73 g • Crispy potato chips',                   deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/lays-chips.jpg',            fallbackImageUrl: 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=400&h=400&fit=crop' },
  { id: 'ms06', name: 'Surf Excel Quick Wash',       price: 9500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Home Essentials',    description: '1 kg • Laundry detergent powder',              deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/surf-excel.jpg',            fallbackImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
  { id: 'ms07', name: 'Dove Soap Bar',               price: 3500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care',      description: '3×75 g Pack • Moisturizing beauty bar',        deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/dove-soap.jpg',             fallbackImageUrl: 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=400&h=400&fit=crop' },
  { id: 'ms08', name: 'Head & Shoulders Shampoo',    price: 17500, storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care',      description: '340 ml • Anti-dandruff shampoo',               deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/head-shoulders.jpg',        fallbackImageUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop' },
  { id: 'ms09', name: 'Tata Salt (Iodized)',         price: 2500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '1 kg • Vacuum evaporated iodized salt',        deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/tata-salt.jpg',             fallbackImageUrl: 'https://images.unsplash.com/photo-1627464987747-0e6977759b32?w=400&h=400&fit=crop' },
  { id: 'ms10', name: 'Nivea Soft Skincare Cream',   price: 14500, storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care',      description: '200 ml • Light moisturizing cream',            deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/nivea.jpg',                 fallbackImageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop' },
];

// VISHAL MART (Groceries)
const vishalProducts: Product[] = [
  { id: 'vm01', name: 'Aashirvaad Chakki Atta',     price: 6500,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Everyday Essentials', description: '1 kg • Premium whole wheat flour',             deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/atta.jpg',                  fallbackImageUrl: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=400&h=400&fit=crop' },
  { id: 'vm02', name: 'India Gate Basmati Rice',    price: 22000, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Everyday Essentials', description: '5 kg • Classic aged basmati rice',             deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/basmati-rice.jpg',           fallbackImageUrl: 'https://images.unsplash.com/photo-1536304993881-ff86d42547e9?w=400&h=400&fit=crop' },
  { id: 'vm03', name: 'Tropicana Mixed Fruit Juice',price: 11000, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Snacks & Beverages',  description: '1 L Tetrapack • 100% Mixed fruit juice',       deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/juice.jpg',                 fallbackImageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop' },
  { id: 'vm04', name: 'Tata Sugar',                 price: 5000,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Cooking Essentials',  description: '1 kg • Fine grain refined sugar',              deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/sugar.jpg',                  fallbackImageUrl: 'https://images.unsplash.com/photo-1584351583219-c52f96b58d0a?w=400&h=400&fit=crop' },
  { id: 'vm05', name: 'Toor Dal (Arhar)',           price: 18000, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Everyday Essentials', description: '1 kg • Premium toor dal pulses',               deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/toor-dal.jpg',               fallbackImageUrl: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&h=400&fit=crop' },
  { id: 'vm06', name: 'Cadbury Dairy Milk Silk',    price: 16000, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Snacks & Beverages',  description: '150 g • Smooth chocolate bar',                 deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/dairy-milk.jpg',             fallbackImageUrl: 'https://images.unsplash.com/photo-1548858602-5364177d7045?w=400&h=400&fit=crop' },
  { id: 'vm07', name: 'Colgate Toothpaste',        price: 9800,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Personal Care',      description: '300 g • Strong Teeth whitening paste',         deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/colgate.jpg',                fallbackImageUrl: 'https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=400&h=400&fit=crop' },
  { id: 'vm08', name: 'Scotch-Brite Kitchen Sponge',price: 3500,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Home Essentials',    description: 'Pack of 3 • Kitchen scrubbing pads',           deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/sponge.jpg',                 fallbackImageUrl: 'https://images.unsplash.com/photo-1585834898863-71a735c0ad0f?w=400&h=400&fit=crop' },
  { id: 'vm09', name: 'Vim Dish Wash Liquid',      price: 5500,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Home Essentials',    description: '750 ml • Lemon-powered dish cleaner',          deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/vim.jpg',                    fallbackImageUrl: 'https://images.unsplash.com/photo-1617107822657-e7fb280e64d4?w=400&h=400&fit=crop' },
  { id: 'vm10', name: 'Harpic Toilet Cleaner',     price: 14900, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Home Essentials',    description: '500 ml • 100% stain removal',                  deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/harpic.jpg',                 fallbackImageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop' },
];

// RR BAZAR (Groceries)
const rrBazarProducts: Product[] = [
  { id: 'rr01', name: 'Sona Masoori Rice',         price: 12000, storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Everyday Essentials', description: '5 kg • Everyday soft rice',                    deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/sona-rice.jpg',              fallbackImageUrl: 'https://images.unsplash.com/photo-1536304993881-ff86d42547e9?w=400&h=400&fit=crop' },
  { id: 'rr02', name: 'Maggi Tomato Ketchup',      price: 13500, storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Cooking Essentials',  description: '1 kg Pouch • Rich tomato sauce',               deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/ketchup.jpg',                fallbackImageUrl: 'https://images.unsplash.com/photo-1585237739563-3168808ed4bf?w=400&h=400&fit=crop' },
  { id: 'rr03', name: 'Ginger Garlic Paste',       price: 2500,  storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Cooking Essentials',  description: '200 g • Freshly ground paste',                 deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/gg-paste.jpg',               fallbackImageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop' },
  { id: 'rr04', name: 'MDH Garam Masala',         price: 9000,  storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Cooking Essentials',  description: '100 g • Premium spice blend',                  deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/garam-masala.jpg',           fallbackImageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop' },
  { id: 'rr05', name: 'Moong Dal (Split)',         price: 16500, storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Everyday Essentials', description: '500 g • Split green moong dal',               deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/moong-dal.jpg',              fallbackImageUrl: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&h=400&fit=crop' },
  { id: 'rr06', name: 'Ariel Matic Liquid',        price: 19900, storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Home Essentials',     description: '1 L • Front load washing liquid',              deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/ariel.jpg',                  fallbackImageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop' },
];

// NANDHINI KGF (Dairy)
const nandhiniProducts: Product[] = [
  { id: 'nd01', name: 'Nandini Pasteurised Milk',  price: 2400,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Milk & Curd',          description: '500 ml • Fresh daily toned milk (3% fat)',     deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-milk.jpg',          fallbackImageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop' },
  { id: 'nd02', name: 'Nandini Fresh Curd',        price: 2500,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Milk & Curd',          description: '500 g • Thick pasteurized curd',               deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-curd.jpg',          fallbackImageUrl: 'https://images.unsplash.com/photo-1558231206-8d6263595166?w=400&h=400&fit=crop' },
  { id: 'nd03', name: 'Nandini Pure Ghee',         price: 16500, storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '200 ml • Rich aromatic pure cow ghee',         deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-ghee.jpg',          fallbackImageUrl: 'https://images.unsplash.com/photo-1623880550478-f6ff67140e43?w=400&h=400&fit=crop' },
  { id: 'nd04', name: 'Nandini Paneer',            price: 11000, storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '200 g • Fresh soft cottage cheese',             deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/paneer.jpg',                fallbackImageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=400&fit=crop' },
  { id: 'nd05', name: 'Nandini Butter',            price: 6500,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '100 g • Salted white butter',                  deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/butter.jpg',                fallbackImageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop' },
  { id: 'nd06', name: 'Vanilla Ice Cream Tub',     price: 18000, storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Ice Cream',            description: '1 L • Classic rich vanilla ice cream',         deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/vanilla-icecream.jpg',      fallbackImageUrl: 'https://images.unsplash.com/photo-1570197781417-0a523758b991?w=400&h=400&fit=crop' },
  { id: 'nd07', name: 'Chocolate Cone Ice Cream',  price: 4500,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Ice Cream',            description: '120 ml • Crispy cone with chocolate chip',     deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/choco-cone.jpg',          fallbackImageUrl: 'https://images.unsplash.com/photo-1559703248-dcaaec9fab78?w=400&h=400&fit=crop' },
  { id: 'nd08', name: 'Amul Fresh Cream',          price: 6500,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '250 ml • Thick cooking cream',                 deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/fresh-cream.jpg',           fallbackImageUrl: 'https://images.unsplash.com/photo-1601004128540-3bc87e793081?w=400&h=400&fit=crop' },
];

export const mockShoppingProducts: Product[] = [
  ...mhethaProducts,
  ...vishalProducts,
  ...rrBazarProducts,
  ...nandhiniProducts,
];

// ─────────────────────────────────────────────────────────────────────────────
// FOOD PRODUCTS (~10 per store)
// ─────────────────────────────────────────────────────────────────────────────

// BAKIO (Bakery)
const bakioProducts: Product[] = [
  { id: 'ba01', name: 'Classic Egg Puff',        price: 2000,  storeId: 'f1', storeName: 'Bakio', category: 'food', subCategory: 'Puffs & Savories', description: '1 Piece • Flaky golden pastry with spiced egg',       deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/egg-puff.jpg',             fallbackImageUrl: 'https://images.unsplash.com/photo-1602492931448-f60879c31403?w=400&h=400&fit=crop' },
  { id: 'ba02', name: 'Fresh Milk Bread',        price: 4000,  storeId: 'f1', storeName: 'Bakio', category: 'food', subCategory: 'Breads & Cakes',   description: '400 g • Soft freshly baked white bread loaf',         deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/milk-bread.jpg',            fallbackImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop' },
  { id: 'ba03', name: 'Black Forest Cake',       price: 45000, storeId: 'f1', storeName: 'Bakio', category: 'food', subCategory: 'Breads & Cakes',   description: '500 g • Chocolate sponge with cherry & cream',        deliveryEtaMinutes: 20, inStock: true, imageUrl: '/images/products/black-forest-cake.jpg',    fallbackImageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
];

// MAYURA (Bakery)
const mayuraProducts: Product[] = [
  { id: 'my01', name: 'Veg Aloo Puff',           price: 1500,  storeId: 'f2', storeName: 'Mayura', category: 'food', subCategory: 'Puffs & Savories', description: '1 Piece • Crispy pastry with spiced potato',         deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/veg-puff.jpg',              fallbackImageUrl: 'https://images.unsplash.com/photo-1587318712395-6d04fc4db04f?w=400&h=400&fit=crop' },
  { id: 'my02', name: 'Dilpasand',               price: 3500,  storeId: 'f2', storeName: 'Mayura', category: 'food', subCategory: 'Breads & Cakes',   description: '1 Piece • Traditional KGF sweet coconut pie',        deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/dilpasand.jpg',             fallbackImageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=400&fit=crop' },
];

// AMBUR BIRIYANI KGF (Restaurant)
const amburProducts: Product[] = [
  { id: 'ab01', name: 'Chicken Dum Biryani',       price: 18000, storeId: 'f3', storeName: 'Ambur Biriyani KGF', category: 'food', subCategory: 'Biryani Specialties', description: '750 ml box • Authentic Ambur-style seeraga samba', deliveryEtaMinutes: 35, inStock: true, imageUrl: '/images/products/chicken-biryani.jpg',      fallbackImageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop' },
  { id: 'ab02', name: 'Kushka (Plain Biryani)',     price: 12000, storeId: 'f3', storeName: 'Ambur Biriyani KGF', category: 'food', subCategory: 'Biryani Specialties', description: '500 ml box • Biryani rice cooked in meat stock',     deliveryEtaMinutes: 30, inStock: true, imageUrl: '/images/products/kushka.jpg',               fallbackImageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop' },
];

// AL BAIK (Fried Chicken)
const alBaikProducts: Product[] = [
  { id: 'ak01', name: 'Crispy Fried Chicken (3 Pcs)',    price: 25000, storeId: 'f4', storeName: 'Al Baik', category: 'food', subCategory: 'Fast Food & Rolls',   description: '3 Pieces • Signature hot & crispy fried chicken',    deliveryEtaMinutes: 40, inStock: true, imageUrl: '/images/products/fried-chicken.jpg',        fallbackImageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop' },
  { id: 'ak02', name: 'Classic Chicken Zinger Burger',  price: 14000, storeId: 'f4', storeName: 'Al Baik', category: 'food', subCategory: 'Fast Food & Rolls',   description: '1 Burger • Crispy chicken fillet with mayo & lettuce', deliveryEtaMinutes: 30, inStock: true, imageUrl: '/images/products/zinger-burger.jpg',        fallbackImageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
];

// AL NAZ (Shawarma & Grills)
const alNazProducts: Product[] = [
  { id: 'an01', name: 'Chicken Shawarma Roll',        price: 9000,  storeId: 'f5', storeName: 'Al Naz', category: 'food', subCategory: 'Fast Food & Rolls',   description: '1 Roll • Grilled chicken wrapped with garlic mayo',     deliveryEtaMinutes: 25, inStock: true, imageUrl: '/images/products/shawarma-roll.jpg',        fallbackImageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop' },
  { id: 'an02', name: 'Mutton Shawarma Roll',         price: 12000, storeId: 'f5', storeName: 'Al Naz', category: 'food', subCategory: 'Fast Food & Rolls',   description: '1 Roll • Grilled mutton strips with tahini sauce',     deliveryEtaMinutes: 25, inStock: true, imageUrl: '/images/products/shawarma-roll.jpg',        fallbackImageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop' },
];

export const mockFoodProducts: Product[] = [
  ...bakioProducts,
  ...mayuraProducts,
  ...amburProducts,
  ...alBaikProducts,
  ...alNazProducts,
];

// ─────────────────────────────────────────────────────────────────────────────
// QUICK PICKS & SMART SECTIONS MOCKS
// ─────────────────────────────────────────────────────────────────────────────

// Removed Quick Picks and Buy Again as per Phase 1 Verdict

export const mockTodaysPicks: Product[] = [
  { ...vishalProducts.find(p => p.id === 'vm06') as Product, price: 14000, description: 'Save ₹20 • 150 g Smooth chocolate' }, // Discounted Dairy Milk
  { ...mhethaProducts.find(p => p.id === 'ms06') as Product, price: 8500, description: 'Save ₹10 • 1 kg Detergent' }, // Discounted Surf Excel
  { ...rrBazarProducts.find(p => p.id === 'rr01') as Product, price: 11000, description: 'Save ₹10 • 5 kg Sona Masoori' }, // Discounted Rice
];
