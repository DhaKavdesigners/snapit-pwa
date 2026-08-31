import { Product, Store } from '../types';

// Helper: returns local path with Unsplash fallback.
export function imgWithFallback(localPath: string, fallbackUrl: string) {
  return { src: localPath, fallback: fallbackUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// STORES
// ─────────────────────────────────────────────────────────────────────────────
export const mockShoppingStores: Store[] = [
  { id: 'g1', name: 'Mhetha Stores', logoUrl: '/images/stores/mhetha-stores/metha-stores.avif', fallbackLogoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300', rating: 4.5, category: 'grocery', isOpen: true },
  { id: 'd1', name: 'Nandhini KGF', logoUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=300&auto=format&fit=crop&q=80', fallbackLogoUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=300', rating: 4.9, category: 'grocery', isOpen: true },
];

export const mockFoodStores: Store[] = [
  { id: 'f1', name: 'Ambur Biriyani KGF', logoUrl: '/images/stores/venus ambur biriyani.jpg', fallbackLogoUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80', rating: 4.8, category: 'food', isOpen: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORE CATEGORIES CONFIGURATION (Modern 2-Column Bento Grid & Pastel Themes)
// ─────────────────────────────────────────────────────────────────────────────
export const exploreShoppingCategories = [
  {
    id: 'cat_vegetables',
    title: 'Fresh Vegetables',
    shortTitle: 'Vegetables',
    subtitle: 'Tomato, Onion, Palak & Veggies',
    emoji: '🥦',
    tag: 'Farm Fresh',
    itemCountText: '15+ Items',
    bgGradient: 'from-emerald-50 via-green-50/70 to-emerald-100/50',
    borderColor: 'border-emerald-200/80',
    accentColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-100/90 text-emerald-800 border-emerald-300/60',
    imageUrl: '/images/cat_exp_head/Vegetables.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'sc_veg_all', name: 'Fresh Vegetables' },
      { id: 'sc_leafy', name: 'Leafy Greens' },
      { id: 'sc_cooking_veg', name: 'Daily Cooking Veggies' },
      { id: 'sc_onion_potato', name: 'Potatoes & Onions' }
    ]
  },
  {
    id: 'cat_fruits',
    title: 'Sweet Fruits',
    shortTitle: 'Fresh Fruits',
    subtitle: 'Apple, Banana, Oranges & Salads',
    emoji: '🍎',
    tag: 'Sweet & Juicy',
    itemCountText: '12+ Items',
    bgGradient: 'from-orange-50 via-amber-50/70 to-orange-100/50',
    borderColor: 'border-orange-200/80',
    accentColor: 'text-orange-800',
    badgeBg: 'bg-orange-100/90 text-orange-800 border-orange-300/60',
    imageUrl: '/images/cat_exp_head/fruits.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'sc_fruits_all', name: 'Fresh Fruits' },
      { id: 'sc_seasonal', name: 'Seasonal Fruits' },
      { id: 'sc_cut_fruits', name: 'Cut Fruits & Salads' }
    ]
  },
  {
    id: 'cat_dairy',
    title: 'Dairy & Milk',
    shortTitle: 'Dairy Essentials',
    subtitle: 'Nandini Milk, Curd, Butter & Ghee',
    emoji: '🥛',
    tag: 'Daily Fresh',
    itemCountText: '10+ Items',
    bgGradient: 'from-blue-50 via-sky-50/70 to-cyan-100/50',
    borderColor: 'border-blue-200/80',
    accentColor: 'text-blue-800',
    badgeBg: 'bg-blue-100/90 text-blue-800 border-blue-300/60',
    imageUrl: '/images/cat_exp_head/dairy_products.webp',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'sc_milk', name: 'Milk & Curd' },
      { id: 'sc_butter', name: 'Butter, Ghee & Cream' },
      { id: 'sc_icecream', name: 'Ice Cream' }
    ]
  },
  {
    id: 'cat_groceries',
    title: 'Daily Groceries',
    shortTitle: 'Atta & Oils',
    subtitle: 'Fortune Oil, Atta, Rice & Masalas',
    emoji: '🛒',
    tag: 'Essentials',
    itemCountText: '25+ Items',
    bgGradient: 'from-amber-50 via-yellow-50/70 to-amber-100/50',
    borderColor: 'border-amber-200/80',
    accentColor: 'text-amber-800',
    badgeBg: 'bg-amber-100/90 text-amber-800 border-amber-300/60',
    imageUrl: '/images/cat_exp_head/grocery-products.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'sc_essentials', name: 'Everyday Essentials' },
      { id: 'sc_cooking', name: 'Cooking Essentials' },
      { id: 'sc_snacks', name: 'Snacks & Beverages' }
    ]
  },
  {
    id: 'cat_juices',
    title: 'Drinks & Juices',
    shortTitle: 'Cold Drinks',
    subtitle: 'Coca-Cola, Frooti, Soda & Juices',
    emoji: '🧃',
    tag: 'Chilled ❄️',
    itemCountText: '14+ Items',
    bgGradient: 'from-rose-50 via-pink-50/70 to-red-100/50',
    borderColor: 'border-rose-200/80',
    accentColor: 'text-rose-800',
    badgeBg: 'bg-rose-100/90 text-rose-800 border-rose-300/60',
    imageUrl: '/images/cat_exp_head/fruits_juices.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'sc_juices_all', name: 'Fresh Fruit Juices' },
      { id: 'sc_sodas', name: 'Cold Drinks & Sodas' },
      { id: 'sc_snacks', name: 'Snacks & Beverages' }
    ]
  },
  {
    id: 'cat_home_care',
    title: 'Personal & Home',
    shortTitle: 'Home Care',
    subtitle: 'Surf Excel, Soaps & Cleaning Needs',
    emoji: '🧼',
    tag: 'Top Hygiene',
    itemCountText: '18+ Items',
    bgGradient: 'from-purple-50 via-violet-50/70 to-indigo-100/50',
    borderColor: 'border-purple-200/80',
    accentColor: 'text-purple-800',
    badgeBg: 'bg-purple-100/90 text-purple-800 border-purple-300/60',
    imageUrl: '/images/cat_exp_head/personaol_care_products.webp',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'sc_personal', name: 'Personal Care' },
      { id: 'sc_home', name: 'Home Essentials' }
    ]
  }
];

export const exploreFoodCategories = [
  {
    id: 'cat_biryani',
    title: 'Ambur Biryani',
    shortTitle: 'Dum Biryani',
    subtitle: 'Authentic Ambur Chicken & Mutton',
    emoji: '🍗',
    tag: 'Hot & Fresh',
    itemCountText: '8+ Dishes',
    bgGradient: 'from-amber-50 via-orange-50/70 to-amber-100/60',
    borderColor: 'border-amber-300/80',
    accentColor: 'text-amber-900',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300/60',
    imageUrl: '/images/categories/biryani.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'fc_biryani', name: 'Biryani Specialties' }
    ]
  },
  {
    id: 'cat_fastfood',
    title: 'Fast Food & Rolls',
    shortTitle: 'Fast Food',
    subtitle: 'Burgers, Shawarmas, Rolls & Fries',
    emoji: '🍔',
    tag: 'Quick Bites',
    itemCountText: '12+ Dishes',
    bgGradient: 'from-red-50 via-rose-50/70 to-red-100/60',
    borderColor: 'border-red-300/80',
    accentColor: 'text-red-900',
    badgeBg: 'bg-red-100 text-red-900 border-red-300/60',
    imageUrl: '/images/categories/fastfood.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'fc_fastfood', name: 'Fast Food & Rolls' }
    ]
  },
  {
    id: 'cat_bakery',
    title: 'Bakery & Sweets',
    shortTitle: 'Bakery & Cakes',
    subtitle: 'Fresh Bread, Puffs, Pastries & Cakes',
    emoji: '🥐',
    tag: 'Oven Fresh',
    itemCountText: '10+ Items',
    bgGradient: 'from-amber-50 via-yellow-50/70 to-orange-100/60',
    borderColor: 'border-amber-300/80',
    accentColor: 'text-amber-900',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300/60',
    imageUrl: '/images/categories/bakery.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    subCategories: [
      { id: 'fc_puffs', name: 'Puffs & Savories' },
      { id: 'fc_breads', name: 'Breads & Cakes' }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

// MHETHA STORES (g1 - Grocery & Essentials)
const mhethaProducts: Product[] = [
  // Snacks & Beverages
  { id: 'ms01', name: 'Maggi 2-Minute Masala Noodles', price: 2800, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '140 g (Pack of 2) • Instant masala noodles', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/maggi-noodles.jpg', fallbackImageUrl: 'https://picsum.photos/seed/kd7clq/400/400' },
  { id: 'ms04', name: 'Parle-G Gold Glucose Biscuits', price: 1000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '450 g • Classic glucose biscuits', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/parle-g.jpg', fallbackImageUrl: 'https://picsum.photos/seed/2wvwdu/400/400' },
  { id: 'ms05', name: 'Lays Classic Salted Chips', price: 2000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '73 g • Crispy salted potato chips', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/lays-chips.jpg', fallbackImageUrl: 'https://picsum.photos/seed/y2bib/400/400' },
  { id: 'ms16', name: 'Lays Magic Masala Chips', price: 2000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '73 g • India\'s favourite masala flavour', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/lays-masala.jpg', fallbackImageUrl: 'https://picsum.photos/seed/laysm1/400/400' },
  { id: 'ms15', name: 'Kurkure Masala Munch', price: 2500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '90 g • Crunchy masala puffed snack', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/kurkure.jpg', fallbackImageUrl: 'https://picsum.photos/seed/kurk01/400/400' },
  { id: 'ms11', name: 'Coca-Cola 750 ml', price: 4500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '750 ml • Classic chilled cola', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/coca-cola.jpg', fallbackImageUrl: 'https://picsum.photos/seed/coke01/400/400' },
  { id: 'ms12', name: 'Pepsi 750 ml', price: 4000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '750 ml • Bold refreshing cola', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/pepsi.jpg', fallbackImageUrl: 'https://picsum.photos/seed/pepsi1/400/400' },
  { id: 'ms13', name: 'Frooti Mango Drink', price: 2000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '200 ml Tetrapack • Fresh mango drink', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/frooti.jpg', fallbackImageUrl: 'https://picsum.photos/seed/froo01/400/400' },
  { id: 'ms14', name: 'Thums Up 750 ml', price: 4500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '750 ml • Strong sparkling cola', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/thumsup.jpg', fallbackImageUrl: 'https://picsum.photos/seed/thums1/400/400' },

  // Cooking & Everyday Essentials
  { id: 'ms02', name: 'Fortune Refined Sunflower Oil', price: 13500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '1 L Pouch • Refined sunflower oil', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/sunflower-oil.jpg', fallbackImageUrl: 'https://picsum.photos/seed/5kgbe8/400/400' },
  { id: 'ms03', name: 'Tata Tea Gold (250g)', price: 4500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '250 g • Strong & aromatic tea', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/tata-tea.jpg', fallbackImageUrl: 'https://picsum.photos/seed/w8ghb/400/400' },
  { id: 'ms09', name: 'Tata Salt (Iodized 1kg)', price: 2500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '1 kg • Vacuum evaporated iodized salt', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/tata-salt.jpg', fallbackImageUrl: 'https://picsum.photos/seed/wfotlq/400/400' },
  { id: 'ms17', name: 'Everest Chicken Masala (100g)', price: 5500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '100 g • Restaurant-style spice blend', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/chicken-masala.jpg', fallbackImageUrl: 'https://picsum.photos/seed/evcm01/400/400' },
  { id: 'ms18', name: 'Catch Turmeric Powder (100g)', price: 3000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '100 g • Pure haldi powder', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/turmeric.jpg', fallbackImageUrl: 'https://picsum.photos/seed/trmr01/400/400' },
  { id: 'ms19', name: 'Aashirvaad Shudh Chakki Atta (5kg)', price: 24500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '5 kg • 100% Whole wheat flour', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/atta.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
  { id: 'ms20', name: 'India Gate Basmati Rice (5kg)', price: 22000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '5 kg • Premium aged basmati rice', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/basmati-rice.jpg', fallbackImageUrl: 'https://picsum.photos/seed/6ohee/400/400' },
  { id: 'ms21', name: 'Premium Toor Dal (1kg)', price: 18000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '1 kg • High protein unpolished toor dal', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/toor-dal.jpg', fallbackImageUrl: 'https://picsum.photos/seed/bezvwp/400/400' },
  { id: 'ms22', name: 'Refined White Sugar (1kg)', price: 4800, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '1 kg • Clean sulfur-free pure sugar', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/sugar.jpg', fallbackImageUrl: 'https://picsum.photos/seed/oityxo/400/400' },

  // Home & Personal Care
  { id: 'ms06', name: 'Surf Excel Quick Wash (1kg)', price: 9500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Home Essentials', description: '1 kg • Advanced stain removal detergent powder', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/surf-excel.jpg', fallbackImageUrl: 'https://picsum.photos/seed/u81fx1/400/400' },
  { id: 'ms07', name: 'Dove Moisturizing Beauty Bar', price: 3500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care', description: '3×75 g Pack • Moisturizing cream soap', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/dove-soap.jpg', fallbackImageUrl: 'https://picsum.photos/seed/fjh8m8/400/400' },
  { id: 'ms08', name: 'Head & Shoulders Shampoo (340ml)', price: 17500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care', description: '340 ml • Anti-dandruff daily shampoo', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/head-shoulders.jpg', fallbackImageUrl: 'https://picsum.photos/seed/4adtm8/400/400' },
  { id: 'ms10', name: 'Nivea Soft Light Cream (200ml)', price: 14500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care', description: '200 ml • Light moisturizing body cream', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/nivea.jpg', fallbackImageUrl: 'https://picsum.photos/seed/3tydwl/400/400' },
  { id: 'ms23', name: 'Vim Lemon Dishwash Liquid (750ml)', price: 5500, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Home Essentials', description: '750 ml • Lemon grease-cutting formula', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/vim.jpg', fallbackImageUrl: 'https://picsum.photos/seed/8axgi/400/400' },
  { id: 'ms24', name: 'Harpic Power Plus (500ml)', price: 14900, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Home Essentials', description: '500 ml • 100% Disinfectant cleaner', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/harpic.jpg', fallbackImageUrl: 'https://picsum.photos/seed/8rdnmm/400/400' },
];

// NANDHINI KGF (Dairy)
const nandhiniProducts: Product[] = [
  { id: 'nd01', name: 'Nandini Pasteurised Milk',  price: 2400,  storeId: 'd1', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Milk & Curd',          description: '500 ml • Fresh daily toned milk (3% fat)',     deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-milk.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/refvga2/400/400' },
  { id: 'nd02', name: 'Nandini Fresh Curd',        price: 2500,  storeId: 'd1', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Milk & Curd',          description: '500 g • Thick pasteurized curd',               deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-curd.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/bafyka/400/400' },
  { id: 'nd03', name: 'Nandini Pure Ghee',         price: 16500, storeId: 'd1', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '200 ml • Rich aromatic pure cow ghee',         deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-ghee.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/ayowi/400/400' },
  { id: 'nd04', name: 'Nandini Paneer',            price: 11000, storeId: 'd1', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '200 g • Fresh soft cottage cheese',             deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/paneer.jpg',                fallbackImageUrl: 'https://picsum.photos/seed/uka6zu/400/400' },
  { id: 'nd05', name: 'Nandini Butter',            price: 6500,  storeId: 'd1', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '100 g • Salted white butter',                  deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/butter.jpg',                fallbackImageUrl: 'https://picsum.photos/seed/lcvu6j/400/400' },
  { id: 'nd06', name: 'Vanilla Ice Cream Tub',     price: 18000, storeId: 'd1', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Ice Cream',            description: '1 L • Classic rich vanilla ice cream',         deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/vanilla-icecream.jpg',      fallbackImageUrl: 'https://picsum.photos/seed/950wb/400/400' },
  { id: 'nd07', name: 'Chocolate Cone Ice Cream',  price: 4500,  storeId: 'd1', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Ice Cream',            description: '120 ml • Crispy cone with chocolate chip',     deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/choco-cone.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/sed9jb/400/400' },
];

// FARM FRESH PRODUCE (Vegetables & Fruits)
const farmFreshProduce: Product[] = [
  { id: 'vg01', name: 'Fresh Farm Red Tomatoes (1kg)', price: 3000,  storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Fresh Vegetables', description: '1 kg • Ripe juicy country farm tomatoes', deliveryEtaMinutes: 10, inStock: true, stockCount: 15, imageUrl: '/images/cat_exp_head/Vegetables.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400' },
  { id: 'vg02', name: 'Farm Fresh Red Onions (1kg)',   price: 3500,  storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Fresh Vegetables', description: '1 kg • Medium size crisp farm onions', deliveryEtaMinutes: 10, inStock: true, stockCount: 20, imageUrl: '/images/cat_exp_head/Vegetables.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400' },
  { id: 'vg03', name: 'Fresh Green Palak / Spinach',   price: 2000,  storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Fresh Vegetables', description: '1 Bunch (250g) • Clean washed green spinach', deliveryEtaMinutes: 10, inStock: true, stockCount: 8, imageUrl: '/images/cat_exp_head/Vegetables.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400' },
  { id: 'vg04', name: 'Fresh Shimla Green Capsicum',   price: 4000,  storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Fresh Vegetables', description: '500 g • Crunchy green bell peppers', deliveryEtaMinutes: 10, inStock: true, stockCount: 12, imageUrl: '/images/cat_exp_head/Vegetables.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400' },
  { id: 'fr01', name: 'Crispy Royal Gala Apples (4 Pcs)', price: 12000, storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Fresh Fruits', description: '4 Pieces (~600g) • Sweet & crunchy imported apples', deliveryEtaMinutes: 10, inStock: true, stockCount: 6, imageUrl: '/images/cat_exp_head/fruits.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400' },
  { id: 'fr02', name: 'Fresh Robusta Bananas (1kg)',   price: 5000,  storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Fresh Fruits', description: '1 kg (6-8 Pcs) • Naturally ripened sweet bananas', deliveryEtaMinutes: 10, inStock: true, stockCount: 14, imageUrl: '/images/cat_exp_head/fruits.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
  { id: 'fr03', name: 'Nagpur Sweet Oranges (1kg)',    price: 9000,  storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Fresh Fruits', description: '1 kg • Juicy Vitamin C rich oranges', deliveryEtaMinutes: 10, inStock: true, stockCount: 9, imageUrl: '/images/cat_exp_head/fruits.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400' },
  { id: 'fr04', name: 'Fresh Green Seedless Grapes',   price: 8000,  storeId: 'g1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Fresh Fruits', description: '500 g Box • Sweet and crisp fresh table grapes', deliveryEtaMinutes: 10, inStock: true, stockCount: 7, imageUrl: '/images/cat_exp_head/fruits.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400' },
];

export const mockShoppingProducts: Product[] = [
  ...farmFreshProduce,
  ...mhethaProducts,
  ...nandhiniProducts,
];

// ─────────────────────────────────────────────────────────────────────────────
// FOOD PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

// AMBUR BIRIYANI KGF (f1)
const amburProducts: Product[] = [
  { id: 'ab01', name: 'Special Chicken Dum Biryani', price: 18000, storeId: 'f1', storeName: 'Ambur Biriyani KGF', category: 'food', subCategory: 'Biryani Specials', description: 'Authentic seeraga samba rice cooked with tender spiced chicken & egg', deliveryEtaMinutes: 20, inStock: true, imageUrl: '/images/products/chicken-biryani.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
  { id: 'ab02', name: 'Mutton Dum Biryani', price: 26000, storeId: 'f1', storeName: 'Ambur Biriyani KGF', category: 'food', subCategory: 'Biryani Specials', description: 'Traditional Ambur style rich mutton biryani with raita & salna', deliveryEtaMinutes: 20, inStock: true, imageUrl: '/images/products/chicken-biryani.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400' },
  { id: 'ab03', name: 'Chicken 65 (Boneless)', price: 15000, storeId: 'f1', storeName: 'Ambur Biriyani KGF', category: 'food', subCategory: 'Starters & Grills', description: 'Crispy fried boneless chicken cubes tossed with curry leaves & green chilies', deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/chicken-biryani.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400' },
  { id: 'ab04', name: 'Paneer Butter Masala', price: 16000, storeId: 'f1', storeName: 'Ambur Biriyani KGF', category: 'food', subCategory: 'Veg Gravies', description: 'Rich tomato cashew butter gravy with fresh paneer cubes', deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/chicken-biryani.jpg', fallbackImageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400' },
];

export const mockFoodProducts: Product[] = [
  ...amburProducts,
];

// ─────────────────────────────────────────────────────────────────────────────
// TODAY'S PICKS
// ─────────────────────────────────────────────────────────────────────────────
export const mockTodaysPicks: Product[] = [
  { ...nandhiniProducts[2], price: 15000, description: 'Save ₹15 • 200 ml Pure Cow Ghee' },
  { ...mhethaProducts[5], price: 8500, description: 'Save ₹10 • 1 kg Surf Excel' },
  { ...farmFreshProduce[0], price: 2500, description: 'Save ₹5 • Fresh Farm Tomatoes 1kg' },
];
