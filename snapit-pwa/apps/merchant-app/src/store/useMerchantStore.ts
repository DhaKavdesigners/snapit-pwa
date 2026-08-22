import { create } from 'zustand';
import type { Order, Merchant, Store, ProductCategory, PaymentMethod } from '../types/snapit-types';
import {
  mockMerchants,
  mockStores,
  mockProductsByStore,
  initialLiveOrders,
  initialHistoricalGroups,
  type ProductInventoryItem,
  type HistoricalDateGroup,
} from '../lib/mockData';
import { counterAudio } from '../lib/audio';

interface MerchantState {
  // ── Auth ──
  isAuthenticated: boolean;
  merchantUser: Merchant | null;
  activeStore: Store;
  login: (userId: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchStoreOutlet: (storeId: string) => void;

  // ── Store Settings ──
  isOnline: boolean;
  toggleStoreStatus: () => void;
  setStoreStatus: (online: boolean) => void;
  rushMode: boolean;
  toggleRushMode: () => void;
  gstPercent: number;
  setGstPercent: (val: number) => void;
  deliveryFeePaise: number;
  setDeliveryFeePaise: (paise: number) => void;

  // ── Audio & Notifications ──
  isMuted: boolean;
  toggleMute: () => void;
  isAlarmPlaying: boolean;

  // ── Live Orders ──
  orders: Order[];
  prepTimers: Record<string, { prepMinutes: number; acceptedAt: number }>;
  orderFilter: 'PLACED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'ALL';
  setOrderFilter: (filter: 'PLACED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'ALL') => void;
  acceptOrder: (orderId: string, prepMinutes: number) => void;
  markOrderPrepared: (orderId: string) => void;
  markRiderAssigned: (orderId: string, riderId?: string) => void;
  markOutForDelivery: (orderId: string) => void;
  markDelivered: (orderId: string) => void;
  handoverToRider: (orderId: string, riderName?: string) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  injectSimulatedOrder: () => void;

  // ── Catalog & Inventory ──
  products: ProductInventoryItem[];
  customCategories: string[];
  addCustomCategory: (category: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  toggleProductStock: (productId: string) => void;
  setProductAvailability: (productId: string, availability: 'AVAILABLE' | 'OUT OF STOCK' | 'UNLISTED') => void;
  updateProductPrice: (productId: string, pricePaise: number) => void;
  updateProductStockCount: (productId: string, count: number) => void;
  adjustProductStockCount: (productId: string, delta: number) => void;
  updateProduct: (productId: string, updates: Partial<ProductInventoryItem>) => void;
  addProduct: (product: Omit<ProductInventoryItem, 'id' | 'storeId'>) => void;
  removeProduct: (productId: string) => void;

  // ── History & Ledger ──
  historicalGroups: HistoricalDateGroup[];

  // ── Modal UI States ──
  prepModalOrderId: string | null;
  setPrepModalOrderId: (id: string | null) => void;
  rejectModalOrderId: string | null;
  setRejectModalOrderId: (id: string | null) => void;
  editingProduct: ProductInventoryItem | null;
  setEditingProduct: (product: ProductInventoryItem | null) => void;
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;
  deletingProductId: string | null;
  setDeletingProductId: (id: string | null) => void;
}

const DEFAULT_STORE_ID = 'f4'; // Al Baik KGF by default

export const useMerchantStore = create<MerchantState>((set, get) => ({
  // Auth
  isAuthenticated: false, // Default to login screen
  merchantUser: null,
  activeStore: mockStores[0],

  login: async (userId: string, _password?: string) => {
    const trimmedId = userId.trim().toLowerCase();

    // Find merchant by UID, store name, or phone number
    const foundMerchant = mockMerchants.find(
      (m) =>
        m.uid.toLowerCase() === trimmedId ||
        m.storeName.toLowerCase() === trimmedId ||
        m.storeName.toLowerCase().replace(/\s+/g, '') === trimmedId ||
        m.storeName.toLowerCase().includes(trimmedId) ||
        m.phone.replace(/\s+/g, '').includes(trimmedId)
    );

    if (!foundMerchant) {
      throw new Error('Merchant ID or Store not found. Please check your credentials.');
    }

    const matchedStore = mockStores.find((s) => s.id === foundMerchant.storeId) || mockStores[0];
    const initialProducts = mockProductsByStore[matchedStore.id] || mockProductsByStore['f4'];

    set({
      isAuthenticated: true,
      merchantUser: foundMerchant,
      activeStore: { ...matchedStore, isOpen: false }, // Initially OFFLINE as specified in rule
      isOnline: false,
      products: initialProducts,
      orders: [], // Clean start - no orders until online
    });

    return { success: true };
  },

  logout: () => {
    // CRITICAL REQUIREMENT:
    // When the merchant logs out:
    // 1. Logout
    // 2. Store automatically becomes OFFLINE
    // 3. Merchant returns to Login Screen
    counterAudio.stopPendingOrderAlarm();
    set((state) => ({
      isAuthenticated: false,
      merchantUser: null,
      isOnline: false,
      activeStore: { ...state.activeStore, isOpen: false },
      isAlarmPlaying: false,
    }));
  },

  switchStoreOutlet: (storeId: string) => {
    const store = mockStores.find((s) => s.id === storeId);
    if (!store) return;
    const merchant = mockMerchants.find((m) => m.storeId === storeId) || get().merchantUser;
    const prods = mockProductsByStore[storeId] || [];

    set({
      activeStore: { ...store, isOpen: get().isOnline },
      merchantUser: merchant,
      products: prods,
    });
  },

  // Store Settings
  isOnline: false, // Initially OFFLINE until merchant switches it on
  toggleStoreStatus: () => {
    const nextStatus = !get().isOnline;
    set((state) => ({
      isOnline: nextStatus,
      activeStore: { ...state.activeStore, isOpen: nextStatus },
    }));
    if (nextStatus) {
      counterAudio.playActionChime();
    }
  },
  setStoreStatus: (online: boolean) => {
    set((state) => ({
      isOnline: online,
      activeStore: { ...state.activeStore, isOpen: online },
    }));
  },
  rushMode: false,
  toggleRushMode: () => {
    const next = !get().rushMode;
    set({ rushMode: next });
    counterAudio.playActionChime();
  },
  gstPercent: 5,
  setGstPercent: (val: number) => set({ gstPercent: val }),
  deliveryFeePaise: 2500, // ₹25
  setDeliveryFeePaise: (paise: number) => set({ deliveryFeePaise: paise }),

  // Audio
  isMuted: false,
  toggleMute: () => {
    const nextMute = !get().isMuted;
    counterAudio.setMuted(nextMute);
    set({ isMuted: nextMute });
  },
  isAlarmPlaying: false,

  // Live Orders
  orders: initialLiveOrders,
  prepTimers: {
    '#7002': { prepMinutes: 15, acceptedAt: Date.now() - 4 * 60 * 1000 },
  },
  orderFilter: 'ALL',
  setOrderFilter: (filter) => set({ orderFilter: filter }),

  acceptOrder: (orderId: string, prepMinutes: number) => {
    counterAudio.playActionChime();

    set((state) => {
      const updatedOrders = state.orders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'PREPARING' as const,
              updatedAt: new Date().toISOString(),
            }
          : ord
      );

      // Check if any other PLACED order is still waiting acceptance
      const remainingPlaced = updatedOrders.filter((o) => o.status === 'PLACED' || o.status === 'PENDING');
      if (remainingPlaced.length === 0) {
        counterAudio.stopPendingOrderAlarm();
      } else {
        counterAudio.playPendingOrderAlarm();
      }

      return {
        orders: updatedOrders,
        isAlarmPlaying: remainingPlaced.length > 0,
        prepTimers: {
          ...state.prepTimers,
          [orderId]: { prepMinutes, acceptedAt: Date.now() },
        },
        prepModalOrderId: null,
      };
    });
  },

  markOrderPrepared: (orderId: string) => {
    counterAudio.unregisterOverdueOrder(orderId);
    counterAudio.playReadyDispatchChime();

    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'READY_FOR_PICKUP' as const,
              updatedAt: new Date().toISOString(),
            }
          : ord
      ),
    }));
  },

  markRiderAssigned: (orderId: string, riderId = 'rider_suresh') => {
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'RIDER_ASSIGNED' as const,
              riderId,
              updatedAt: new Date().toISOString(),
            }
          : ord
      ),
    }));
  },

  markOutForDelivery: (orderId: string) => {
    counterAudio.playActionChime();
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'OUT_FOR_DELIVERY' as const,
              updatedAt: new Date().toISOString(),
            }
          : ord
      ),
    }));
  },

  handoverToRider: (orderId: string, riderName = 'Suresh (SnapIt Rider)') => {
    counterAudio.unregisterOverdueOrder(orderId);
    counterAudio.playReadyDispatchChime();

    set((state) => {
      const targetOrder = state.orders.find((o) => o.id === orderId);
      const remainingLiveOrders = state.orders.filter((o) => o.id !== orderId);

      if (!targetOrder) return { orders: state.orders };

      const deliveredOrder: Order = {
        ...targetOrder,
        status: 'DELIVERED',
        deliveryVerified: true,
        updatedAt: new Date().toISOString(),
      };

      // Add to Today's Historical Group and remove from live queue
      const updatedHistory = state.historicalGroups.map((group, idx) => {
        if (idx === 0) {
          return {
            ...group,
            orderCount: group.orderCount + 1,
            collectedPaise: group.collectedPaise + deliveredOrder.estimatedTotal,
            orders: [deliveredOrder, ...group.orders],
          };
        }
        return group;
      });

      return {
        orders: remainingLiveOrders,
        historicalGroups: updatedHistory,
      };
    });
  },

  markDelivered: (orderId: string) => {
    counterAudio.playActionChime();

    set((state) => {
      const targetOrder = state.orders.find((o) => o.id === orderId);
      const remainingLiveOrders = state.orders.filter((o) => o.id !== orderId);

      if (!targetOrder) return { orders: state.orders };

      const deliveredOrder: Order = {
        ...targetOrder,
        status: 'DELIVERED',
        deliveryVerified: true,
        updatedAt: new Date().toISOString(),
      };

      // Add to Today's Historical Group
      const updatedHistory = state.historicalGroups.map((group, idx) => {
        if (idx === 0) {
          return {
            ...group,
            orderCount: group.orderCount + 1,
            collectedPaise: group.collectedPaise + deliveredOrder.estimatedTotal,
            orders: [deliveredOrder, ...group.orders],
          };
        }
        return group;
      });

      return {
        orders: remainingLiveOrders,
        historicalGroups: updatedHistory,
      };
    });
  },

  rejectOrder: (orderId: string, _reason: string) => {
    counterAudio.playCancelSound();

    set((state) => {
      const targetOrder = state.orders.find((o) => o.id === orderId);
      const remainingLiveOrders = state.orders.filter((o) => o.id !== orderId);

      if (!targetOrder) return { orders: state.orders, rejectModalOrderId: null };

      const cancelledOrder: Order = {
        ...targetOrder,
        status: 'CANCELLED',
        updatedAt: new Date().toISOString(),
      };

      // Add to today's historical group as rejected
      const updatedHistory = state.historicalGroups.map((group, idx) => {
        if (idx === 0) {
          return {
            ...group,
            rejectedCount: group.rejectedCount + 1,
            lostPaise: group.lostPaise + cancelledOrder.estimatedTotal,
            orders: [cancelledOrder, ...group.orders],
          };
        }
        return group;
      });

      const remainingPlaced = remainingLiveOrders.filter((o) => o.status === 'PLACED' || o.status === 'PENDING');
      if (remainingPlaced.length === 0) {
        counterAudio.stopPendingOrderAlarm();
      } else {
        counterAudio.playPendingOrderAlarm();
      }

      return {
        orders: remainingLiveOrders,
        isAlarmPlaying: remainingPlaced.length > 0,
        historicalGroups: updatedHistory,
        rejectModalOrderId: null,
      };
    });
  },

  injectSimulatedOrder: () => {
    // 1. RULE: Store must be ONLINE to accept customer orders
    if (!get().isOnline) {
      alert('⚠️ Store is currently OFFLINE.\n\nPlease switch your store ONLINE using the top header switch to start accepting customer orders.');
      return;
    }

    const randomId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const currentProds = get().products.filter((p) => p.availability === 'AVAILABLE');
    const selectedProd = currentProds[Math.floor(Math.random() * currentProds.length)] || {
      id: 'ak01',
      name: 'Crispy Fried Chicken (1pc)',
      price: 17500,
    };

    const paymentMethods: PaymentMethod[] = ['UPI_NOW', 'UPI_DELIVERY'];
    const names = ['Kavitha R', 'Suresh Babu', 'Arun Kumar', 'Divya M', 'Farooq Ahmed'];
    const selectedName = names[Math.floor(Math.random() * names.length)];

    const newOrder: Order = {
      id: randomId,
      customerId: `cust_${Date.now()}`,
      storeId: get().activeStore.id,
      status: 'PLACED',
      items: [{ productId: selectedProd.id, quantity: Math.floor(1 + Math.random() * 2) }],
      estimatedTotal: selectedProd.price * (Math.random() > 0.5 ? 2 : 1),
      deliveryAddress: {
        label: 'Home',
        line1: 'Geetha Road, Near Town Hall',
        city: 'KGF',
        pincode: '563122',
      },
      cookingInstructions: Math.random() > 0.4 ? 'Please deliver hot, call before arriving.' : undefined,
      idempotencyKey: `idemp-sim-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: 'UPI_NOW', // All orders are 100% Prepaid Online via UPI
      recipientName: selectedName,
      recipientPhone: '+91 9845' + Math.floor(100000 + Math.random() * 900000),
    };

    set((state) => ({
      orders: [newOrder, ...state.orders],
      isAlarmPlaying: true,
    }));

    counterAudio.playPendingOrderAlarm();
  },

  // Catalog & Inventory
  products: mockProductsByStore['f4'],
  customCategories: [
    'Fried Chicken',
    'Burgers',
    'Sides & Fries',
    'Biryani Specials',
    'Noodles & Snacks',
    'Edible Oils',
    'Atta & Flours',
    'Milk & Curd',
    'Butter & Ghee',
    'Paneer & Cheese',
    'Soaps & Detergents',
    'Beverages',
    'Starters & Grills',
    'Chinese Items',
    'Indian Gravies',
    'Vegetarian',
    'Non-Veg Specials',
    'Rice & Grains',
    'Spices & Powders',
  ],
  addCustomCategory: (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.customCategories.includes(trimmed)) return state;
      return { customCategories: [trimmed, ...state.customCategories] };
    });
  },
  selectedCategory: 'ALL',
  setSelectedCategory: (cat: string) => set({ selectedCategory: cat }),

  toggleProductStock: (productId: string) => {
    set((state) => ({
      products: state.products.map((p) => {
        if (p.id === productId) {
          const nextInStock = !p.inStock;
          return {
            ...p,
            inStock: nextInStock,
            availability: nextInStock ? 'AVAILABLE' : 'OUT OF STOCK',
            stockCount: nextInStock ? (p.stockCount > 0 ? p.stockCount : 50) : 0,
          };
        }
        return p;
      }),
    }));
    counterAudio.playActionChime();
  },

  setProductAvailability: (productId: string, availability: 'AVAILABLE' | 'OUT OF STOCK' | 'UNLISTED') => {
    set((state) => ({
      products: state.products.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            availability,
            inStock: availability === 'AVAILABLE',
            stockCount: availability === 'AVAILABLE' ? (p.stockCount > 0 ? p.stockCount : 50) : 0,
          };
        }
        return p;
      }),
    }));
    counterAudio.playActionChime();
  },

  updateProductPrice: (productId: string, pricePaise: number) => {
    if (pricePaise <= 0) return;
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, price: pricePaise } : p
      ),
    }));
    counterAudio.playActionChime();
  },

  updateProductStockCount: (productId: string, count: number) => {
    const safeCount = Math.max(0, count);
    const nextInStock = safeCount > 0;
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              stockCount: safeCount,
              inStock: nextInStock,
              availability: nextInStock ? 'AVAILABLE' : 'OUT OF STOCK',
            }
          : p
      ),
    }));
  },

  adjustProductStockCount: (productId: string, delta: number) => {
    set((state) => ({
      products: state.products.map((p) => {
        if (p.id === productId) {
          const nextCount = Math.max(0, p.stockCount + delta);
          const nextInStock = nextCount > 0;
          return {
            ...p,
            stockCount: nextCount,
            inStock: nextInStock,
            availability: nextInStock ? 'AVAILABLE' : 'OUT OF STOCK',
          };
        }
        return p;
      }),
    }));
  },

  updateProduct: (productId: string, updates: Partial<ProductInventoryItem>) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
      editingProduct: null,
    }));
    counterAudio.playActionChime();
  },

  addProduct: (newProdData) => {
    const newId = `p_${Date.now().toString().slice(-6)}`;
    const newProduct: ProductInventoryItem = {
      ...newProdData,
      id: newId,
      storeId: get().activeStore.id,
      inStock: newProdData.availability === 'AVAILABLE',
    };

    set((state) => ({
      products: [newProduct, ...state.products],
      isAddProductOpen: false,
    }));
    counterAudio.playActionChime();
  },

  removeProduct: (productId: string) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
      deletingProductId: null,
    }));
    counterAudio.playCancelSound();
  },

  // History & Ledger
  historicalGroups: initialHistoricalGroups,

  // Modals
  prepModalOrderId: null,
  setPrepModalOrderId: (id) => set({ prepModalOrderId: id }),
  rejectModalOrderId: null,
  setRejectModalOrderId: (id) => set({ rejectModalOrderId: id }),
  editingProduct: null,
  setEditingProduct: (prod) => set({ editingProduct: prod }),
  isAddProductOpen: false,
  setIsAddProductOpen: (open) => set({ isAddProductOpen: open }),
  deletingProductId: null,
  setDeletingProductId: (id) => set({ deletingProductId: id }),
}));
