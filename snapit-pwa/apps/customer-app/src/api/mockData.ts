import { Product, Store } from '../types';

// Helper: returns local path with Unsplash fallback.
export function imgWithFallback(localPath: string, fallbackUrl: string) {
  return { src: localPath, fallback: fallbackUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// STORES
// ─────────────────────────────────────────────────────────────────────────────
export const mockShoppingStores: Store[] = [
  { id: 's1', name: 'Mhetha Stores',  logoUrl: '/images/stores/mhetha-stores/logo.jpg',        fallbackLogoUrl: 'https://picsum.photos/seed/ohr5ug/200/200', rating: 4.5, category: 'grocery', isOpen: true },
  { id: 's2', name: 'Vishal Mart',    logoUrl: '/images/stores/vishal-mart/logo.jpg',           fallbackLogoUrl: 'https://picsum.photos/seed/6g5uzk/200/200', rating: 4.2, category: 'grocery', isOpen: true },
  { id: 's3', name: 'RR Bazar',       logoUrl: '/images/stores/rr-bazar/logo.jpg',              fallbackLogoUrl: 'https://picsum.photos/seed/cn8b09/200/200', rating: 4.6, category: 'grocery', isOpen: true },
  { id: 's4', name: 'Nandhini KGF',   logoUrl: '/images/stores/nandhini-kgf/logo.jpg',          fallbackLogoUrl: 'https://picsum.photos/seed/7cmzc/200/200', rating: 4.9, category: 'grocery', isOpen: true },
];

export const mockFoodStores: Store[] = [
  { id: 'f1', name: 'Bakio',               logoUrl: '/images/stores/bakio/logo.jpg',              fallbackLogoUrl: 'https://picsum.photos/seed/7wvu1q/200/200', rating: 4.7, category: 'food', isOpen: true },
  { id: 'f2', name: 'Mayura',              logoUrl: '/images/stores/mayura/logo.jpg',             fallbackLogoUrl: 'https://picsum.photos/seed/s3fgpb/200/200', rating: 4.4, category: 'food', isOpen: true },
  { id: 'f3', name: 'Ambur Biriyani KGF', logoUrl: '/images/stores/ambur-biriyani-kgf/logo.jpg', fallbackLogoUrl: 'https://picsum.photos/seed/4vhgwt/200/200', rating: 4.8, category: 'food', isOpen: true },
  { id: 'f4', name: 'Al Baik',            logoUrl: '/images/stores/al-baik/logo.jpg',            fallbackLogoUrl: 'https://picsum.photos/seed/az3k9/200/200', rating: 4.5, category: 'food', isOpen: true },
  { id: 'f5', name: 'Al Naz',             logoUrl: '/images/stores/al-naz/logo.jpg',             fallbackLogoUrl: 'https://picsum.photos/seed/out76/200/200', rating: 4.3, category: 'food', isOpen: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORE CATEGORIES CONFIGURATION (Refined with Images)
// ─────────────────────────────────────────────────────────────────────────────
export const exploreShoppingCategories = [
  {
    id: 'cat_groceries',
    title: '🛒 Grocery',
    imageUrl: '/images/categories/grocery.jpg',
    fallbackImageUrl: 'https://picsum.photos/seed/1aess7/600/400',
    subCategories: [
      { id: 'sc_essentials', name: 'Everyday Essentials' },
      { id: 'sc_cooking', name: 'Cooking Essentials' },
      { id: 'sc_snacks', name: 'Snacks & Beverages' }
    ]
  },
  {
    id: 'cat_dairy',
    title: '🥛 Dairy & Chilled',
    imageUrl: '/images/categories/dairy.jpg',
    fallbackImageUrl: 'https://picsum.photos/seed/7or2pn/600/400',
    subCategories: [
      { id: 'sc_milk', name: 'Milk & Curd' },
      { id: 'sc_butter', name: 'Butter, Ghee & Cream' },
      { id: 'sc_icecream', name: 'Ice Cream' }
    ]
  },
  {
    id: 'cat_home_care',
    title: '🧴 Personal & Home Care',
    imageUrl: '/images/categories/homecare.jpg',
    fallbackImageUrl: 'https://picsum.photos/seed/ey4xfh/600/400',
    subCategories: [
      { id: 'sc_personal', name: 'Personal Care' },
      { id: 'sc_home', name: 'Home Essentials' }
    ]
  }
];

export const exploreFoodCategories = [
  {
    id: 'cat_biryani',
    title: '🍚 Biryani Specialties',
    imageUrl: '/images/categories/biryani.jpg',
    fallbackImageUrl: 'https://picsum.photos/seed/mon6/600/400',
    subCategories: [
      { id: 'fc_biryani', name: 'Biryani Specialties' }
    ]
  },
  {
    id: 'cat_fastfood',
    title: '🍔 Fast Food & Rolls',
    imageUrl: '/images/categories/fastfood.jpg',
    fallbackImageUrl: 'https://picsum.photos/seed/37hmk/600/400',
    subCategories: [
      { id: 'fc_fastfood', name: 'Fast Food & Rolls' }
    ]
  },
  {
    id: 'cat_bakery',
    title: '🥐 Bakery & Sweets',
    imageUrl: '/images/categories/bakery.jpg',
    fallbackImageUrl: 'https://picsum.photos/seed/duyi3d/600/400',
    subCategories: [
      { id: 'fc_puffs', name: 'Puffs & Savories' },
      { id: 'fc_breads', name: 'Breads & Cakes' }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

// MHETHA STORES (Groceries)
const mhethaProducts: Product[] = [
  { id: 'ms01', name: 'Maggi 2-Minute Noodles',      price: 2800,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '140 g (Pack of 2) • Instant masala noodles', deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/maggi-noodles.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/kd7clq/400/400' },
  { id: 'ms02', name: 'Fortune Sunflower Oil',        price: 13500, storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Everyday Essentials', description: '1 L Pouch • Refined sunflower oil',            deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/sunflower-oil.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/5kgbe8/400/400' },
  { id: 'ms03', name: 'Tata Tea Gold',               price: 4500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '250 g • Strong & aromatic tea',                deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/tata-tea.jpg',              fallbackImageUrl: 'https://picsum.photos/seed/w8ghb/400/400' },
  { id: 'ms04', name: 'Parle-G Gold Biscuits',       price: 1000,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '450 g • Classic glucose biscuits',             deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/parle-g.jpg',               fallbackImageUrl: 'https://picsum.photos/seed/2wvwdu/400/400' },
  { id: 'ms05', name: 'Lays Classic Salted',         price: 2000,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '73 g • Crispy potato chips',                   deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/lays-chips.jpg',            fallbackImageUrl: 'https://picsum.photos/seed/y2bib/400/400' },
  { id: 'ms06', name: 'Surf Excel Quick Wash',       price: 9500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Home Essentials',    description: '1 kg • Laundry detergent powder',              deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/surf-excel.jpg',            fallbackImageUrl: 'https://picsum.photos/seed/u81fx1/400/400' },
  { id: 'ms07', name: 'Dove Soap Bar',               price: 3500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care',      description: '3×75 g Pack • Moisturizing beauty bar',        deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/dove-soap.jpg',             fallbackImageUrl: 'https://picsum.photos/seed/fjh8m8/400/400' },
  { id: 'ms08', name: 'Head & Shoulders Shampoo',    price: 17500, storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care',      description: '340 ml • Anti-dandruff shampoo',               deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/head-shoulders.jpg',        fallbackImageUrl: 'https://picsum.photos/seed/4adtm8/400/400' },
  { id: 'ms09', name: 'Tata Salt (Iodized)',         price: 2500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '1 kg • Vacuum evaporated iodized salt',        deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/tata-salt.jpg',             fallbackImageUrl: 'https://picsum.photos/seed/wfotlq/400/400' },
  { id: 'ms10', name: 'Nivea Soft Cream',            price: 14500, storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Personal Care',      description: '200 ml • Light moisturizing cream',            deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/nivea.jpg',                 fallbackImageUrl: 'https://picsum.photos/seed/3tydwl/400/400' },
  // ── Extra Snacks & Beverages (for rich horizontal row) ──────────────────
  { id: 'ms11', name: 'Coca-Cola 750 ml',            price: 4500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '750 ml • Classic chilled cola',                 deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/coca-cola.jpg',             fallbackImageUrl: 'https://picsum.photos/seed/coke01/400/400' },
  { id: 'ms12', name: 'Pepsi 750 ml',                price: 4000,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '750 ml • Bold refreshing cola',                 deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/pepsi.jpg',                 fallbackImageUrl: 'https://picsum.photos/seed/pepsi1/400/400' },
  { id: 'ms13', name: 'Frooti Mango Drink',          price: 2000,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '200 ml Tetrapack • Fresh n Juicy mango drink',  deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/frooti.jpg',                fallbackImageUrl: 'https://picsum.photos/seed/froo01/400/400' },
  { id: 'ms14', name: 'Thums Up 750 ml',             price: 4500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '750 ml • Strong sparkling cola',                deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/thumsup.jpg',               fallbackImageUrl: 'https://picsum.photos/seed/thums1/400/400' },
  { id: 'ms15', name: 'Kurkure Masala Munch',        price: 2500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '90 g • Crunchy masala puffed snack',           deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/kurkure.jpg',               fallbackImageUrl: 'https://picsum.photos/seed/kurk01/400/400' },
  { id: 'ms16', name: 'Lays Magic Masala',           price: 2000,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Snacks & Beverages', description: '73 g • India\'s favourite masala flavour',       deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/lays-masala.jpg',           fallbackImageUrl: 'https://picsum.photos/seed/laysm1/400/400' },
  // ── Extra Masalas ───────────────────────────────────────────────────────
  { id: 'ms17', name: 'Everest Chicken Masala',      price: 5500,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '100 g • Restaurant-style spice blend',         deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/chicken-masala.jpg',        fallbackImageUrl: 'https://picsum.photos/seed/evcm01/400/400' },
  { id: 'ms18', name: 'Catch Turmeric Powder',       price: 3000,  storeId: 's1', storeName: 'Mhetha Stores', category: 'grocery', subCategory: 'Cooking Essentials', description: '100 g • Pure haldi for everyday cooking',      deliveryEtaMinutes: 10, inStock: true, imageUrl: '/images/products/turmeric.jpg',              fallbackImageUrl: 'https://picsum.photos/seed/trmr01/400/400' },
];


// VISHAL MART (Groceries)
const vishalProducts: Product[] = [
  { id: 'vm01', name: 'Aashirvaad Chakki Atta',     price: 6500,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Everyday Essentials', description: '1 kg • Premium whole wheat flour',             deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/atta.jpg',                  fallbackImageUrl: 'https://picsum.photos/seed/1af6h/400/400' },
  { id: 'vm02', name: 'India Gate Basmati Rice',    price: 22000, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Everyday Essentials', description: '5 kg • Classic aged basmati rice',             deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/basmati-rice.jpg',           fallbackImageUrl: 'https://picsum.photos/seed/6ohee/400/400' },
  { id: 'vm03', name: 'Tropicana Mixed Fruit Juice',price: 11000, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Snacks & Beverages',  description: '1 L Tetrapack • 100% Mixed fruit juice',       deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/juice.jpg',                 fallbackImageUrl: 'https://picsum.photos/seed/w93ab5/400/400' },
  { id: 'vm04', name: 'Tata Sugar',                 price: 5000,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Cooking Essentials',  description: '1 kg • Fine grain refined sugar',              deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/sugar.jpg',                  fallbackImageUrl: 'https://picsum.photos/seed/oityxo/400/400' },
  { id: 'vm05', name: 'Toor Dal (Arhar)',           price: 18000, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Everyday Essentials', description: '1 kg • Premium toor dal pulses',               deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/toor-dal.jpg',               fallbackImageUrl: 'https://picsum.photos/seed/bezvwp/400/400' },
  { id: 'vm06', name: 'Cadbury Dairy Milk Silk',    price: 16000, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Snacks & Beverages',  description: '150 g • Smooth chocolate bar',                 deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/dairy-milk.jpg',             fallbackImageUrl: 'https://picsum.photos/seed/sldelw/400/400' },
  { id: 'vm07', name: 'Colgate Toothpaste',        price: 9800,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Personal Care',      description: '300 g • Strong Teeth whitening paste',         deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/colgate.jpg',                fallbackImageUrl: 'https://picsum.photos/seed/kd76v/400/400' },
  { id: 'vm08', name: 'Scotch-Brite Kitchen Sponge',price: 3500,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Home Essentials',    description: 'Pack of 3 • Kitchen scrubbing pads',           deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/sponge.jpg',                 fallbackImageUrl: 'https://picsum.photos/seed/b41ko/400/400' },
  { id: 'vm09', name: 'Vim Dish Wash Liquid',      price: 5500,  storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Home Essentials',    description: '750 ml • Lemon-powered dish cleaner',          deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/vim.jpg',                    fallbackImageUrl: 'https://picsum.photos/seed/8axgi/400/400' },
  { id: 'vm10', name: 'Harpic Toilet Cleaner',     price: 14900, storeId: 's2', storeName: 'Vishal Mart', category: 'grocery', subCategory: 'Home Essentials',    description: '500 ml • 100% stain removal',                  deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/harpic.jpg',                 fallbackImageUrl: 'https://picsum.photos/seed/8rdnmm/400/400' },
];

// RR BAZAR (Groceries)
const rrBazarProducts: Product[] = [
  { id: 'rr01', name: 'Sona Masoori Rice',         price: 12000, storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Everyday Essentials', description: '5 kg • Everyday soft rice',                    deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/sona-rice.jpg',              fallbackImageUrl: 'https://picsum.photos/seed/mu6mm/400/400' },
  { id: 'rr02', name: 'Maggi Tomato Ketchup',      price: 13500, storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Cooking Essentials',  description: '1 kg Pouch • Rich tomato sauce',               deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/ketchup.jpg',                fallbackImageUrl: 'https://picsum.photos/seed/364m0cr/400/400' },
  { id: 'rr03', name: 'Ginger Garlic Paste',       price: 2500,  storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Cooking Essentials',  description: '200 g • Freshly ground paste',                 deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/gg-paste.jpg',               fallbackImageUrl: 'https://picsum.photos/seed/p4n33g/400/400' },
  { id: 'rr04', name: 'MDH Garam Masala',         price: 9000,  storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Cooking Essentials',  description: '100 g • Premium spice blend',                  deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/garam-masala.jpg',           fallbackImageUrl: 'https://picsum.photos/seed/3kpandb/400/400' },
  { id: 'rr05', name: 'Moong Dal (Split)',         price: 16500, storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Everyday Essentials', description: '500 g • Split green moong dal',               deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/moong-dal.jpg',              fallbackImageUrl: 'https://picsum.photos/seed/yi50a/400/400' },
  { id: 'rr06', name: 'Ariel Matic Liquid',        price: 19900, storeId: 's3', storeName: 'RR Bazar', category: 'grocery', subCategory: 'Home Essentials',     description: '1 L • Front load washing liquid',              deliveryEtaMinutes: 12, inStock: true, imageUrl: '/images/products/ariel.jpg',                  fallbackImageUrl: 'https://picsum.photos/seed/7brrl7/400/400' },
];

// NANDHINI KGF (Dairy)
const nandhiniProducts: Product[] = [
  { id: 'nd01', name: 'Nandini Pasteurised Milk',  price: 2400,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Milk & Curd',          description: '500 ml • Fresh daily toned milk (3% fat)',     deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-milk.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/refvga2/400/400' },
  { id: 'nd02', name: 'Nandini Fresh Curd',        price: 2500,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Milk & Curd',          description: '500 g • Thick pasteurized curd',               deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-curd.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/bafyka/400/400' },
  { id: 'nd03', name: 'Nandini Pure Ghee',         price: 16500, storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '200 ml • Rich aromatic pure cow ghee',         deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/nandini-ghee.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/ayowi/400/400' },
  { id: 'nd04', name: 'Nandini Paneer',            price: 11000, storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '200 g • Fresh soft cottage cheese',             deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/paneer.jpg',                fallbackImageUrl: 'https://picsum.photos/seed/uka6zu/400/400' },
  { id: 'nd05', name: 'Nandini Butter',            price: 6500,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '100 g • Salted white butter',                  deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/butter.jpg',                fallbackImageUrl: 'https://picsum.photos/seed/lcvu6j/400/400' },
  { id: 'nd06', name: 'Vanilla Ice Cream Tub',     price: 18000, storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Ice Cream',            description: '1 L • Classic rich vanilla ice cream',         deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/vanilla-icecream.jpg',      fallbackImageUrl: 'https://picsum.photos/seed/950wb/400/400' },
  { id: 'nd07', name: 'Chocolate Cone Ice Cream',  price: 4500,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Ice Cream',            description: '120 ml • Crispy cone with chocolate chip',     deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/choco-cone.jpg',          fallbackImageUrl: 'https://picsum.photos/seed/sed9jb/400/400' },
  { id: 'nd08', name: 'Amul Fresh Cream',          price: 6500,  storeId: 's4', storeName: 'Nandhini KGF', category: 'grocery', subCategory: 'Butter, Ghee & Cream', description: '250 ml • Thick cooking cream',                 deliveryEtaMinutes: 8,  inStock: true, imageUrl: '/images/products/fresh-cream.jpg',           fallbackImageUrl: 'https://picsum.photos/seed/tvs936/400/400' },
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
  { id: 'ba01', name: 'Classic Egg Puff',        price: 2000,  storeId: 'f1', storeName: 'Bakio', category: 'food', subCategory: 'Puffs & Savories', description: '1 Piece • Flaky golden pastry with spiced egg',       deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/egg-puff.jpg',             fallbackImageUrl: 'https://picsum.photos/seed/j6j6s8/400/400' },
  { id: 'ba02', name: 'Fresh Milk Bread',        price: 4000,  storeId: 'f1', storeName: 'Bakio', category: 'food', subCategory: 'Breads & Cakes',   description: '400 g • Soft freshly baked white bread loaf',         deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/milk-bread.jpg',            fallbackImageUrl: 'https://picsum.photos/seed/bj4u1/400/400' },
  { id: 'ba03', name: 'Black Forest Cake',       price: 45000, storeId: 'f1', storeName: 'Bakio', category: 'food', subCategory: 'Breads & Cakes',   description: '500 g • Chocolate sponge with cherry & cream',        deliveryEtaMinutes: 20, inStock: true, imageUrl: '/images/products/black-forest-cake.jpg',    fallbackImageUrl: 'https://picsum.photos/seed/0s28zv/400/400' },
];

// MAYURA (Bakery)
const mayuraProducts: Product[] = [
  { id: 'my01', name: 'Veg Aloo Puff',           price: 1500,  storeId: 'f2', storeName: 'Mayura', category: 'food', subCategory: 'Puffs & Savories', description: '1 Piece • Crispy pastry with spiced potato',         deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/veg-puff.jpg',              fallbackImageUrl: 'https://picsum.photos/seed/q7r47k/400/400' },
  { id: 'my02', name: 'Dilpasand',               price: 3500,  storeId: 'f2', storeName: 'Mayura', category: 'food', subCategory: 'Breads & Cakes',   description: '1 Piece • Traditional KGF sweet coconut pie',        deliveryEtaMinutes: 15, inStock: true, imageUrl: '/images/products/dilpasand.jpg',             fallbackImageUrl: 'https://picsum.photos/seed/ltb5jf/400/400' },
];

// AMBUR BIRIYANI KGF (Restaurant)
const amburProducts: Product[] = [
  { id: 'ab01', name: 'Chicken Dum Biryani',       price: 18000, storeId: 'f3', storeName: 'Ambur Biriyani KGF', category: 'food', subCategory: 'Biryani Specialties', description: '750 ml box • Authentic Ambur-style seeraga samba', deliveryEtaMinutes: 35, inStock: true, imageUrl: '/images/products/chicken-biryani.jpg',      fallbackImageUrl: 'https://picsum.photos/seed/y6vmgo/400/400' },
  { id: 'ab02', name: 'Kushka (Plain Biryani)',     price: 12000, storeId: 'f3', storeName: 'Ambur Biriyani KGF', category: 'food', subCategory: 'Biryani Specialties', description: '500 ml box • Biryani rice cooked in meat stock',     deliveryEtaMinutes: 30, inStock: true, imageUrl: '/images/products/kushka.jpg',               fallbackImageUrl: 'https://picsum.photos/seed/admcmb/400/400' },
];

// AL BAIK (Fried Chicken)
const alBaikProducts: Product[] = [
  { id: 'ak01', name: 'Crispy Fried Chicken (3 Pcs)',    price: 25000, storeId: 'f4', storeName: 'Al Baik', category: 'food', subCategory: 'Fast Food & Rolls',   description: '3 Pieces • Signature hot & crispy fried chicken',    deliveryEtaMinutes: 40, inStock: true, imageUrl: '/images/products/fried-chicken.jpg',        fallbackImageUrl: 'https://picsum.photos/seed/x9eu5h/400/400' },
  { id: 'ak02', name: 'Classic Chicken Zinger Burger',  price: 14000, storeId: 'f4', storeName: 'Al Baik', category: 'food', subCategory: 'Fast Food & Rolls',   description: '1 Burger • Crispy chicken fillet with mayo & lettuce', deliveryEtaMinutes: 30, inStock: true, imageUrl: '/images/products/zinger-burger.jpg',        fallbackImageUrl: 'https://picsum.photos/seed/9to3tf/400/400' },
];

// AL NAZ (Shawarma & Grills)
const alNazProducts: Product[] = [
  { id: 'an01', name: 'Chicken Shawarma Roll',        price: 9000,  storeId: 'f5', storeName: 'Al Naz', category: 'food', subCategory: 'Fast Food & Rolls',   description: '1 Roll • Grilled chicken wrapped with garlic mayo',     deliveryEtaMinutes: 25, inStock: true, imageUrl: '/images/products/shawarma-roll.jpg',        fallbackImageUrl: 'https://picsum.photos/seed/4k83n/400/400' },
  { id: 'an02', name: 'Mutton Shawarma Roll',         price: 12000, storeId: 'f5', storeName: 'Al Naz', category: 'food', subCategory: 'Fast Food & Rolls',   description: '1 Roll • Grilled mutton strips with tahini sauce',     deliveryEtaMinutes: 25, inStock: true, imageUrl: '/images/products/shawarma-roll.jpg',        fallbackImageUrl: 'https://picsum.photos/seed/qjwbc/400/400' },
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
