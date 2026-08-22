import { create } from 'zustand';
import { counterAudio } from '../lib/audio';
import {
  mockStores,
  mockProductsByStore,
  initialHistoricalGroups,
  type ProductInventoryItem,
  type HistoricalDateGroup,
} from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Order,
  Store,
  Merchant,
} from '../types/snapit-types';

export { type ProductInventoryItem };

export interface MerchantUser extends Merchant {
  category?: string;
}

interface MerchantState {
  // Auth & Store Identity
  isAuthenticated: boolean;
  merchantUser: MerchantUser | null;
  activeStore: Store;
  login: (idOrName: string, password?: string) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  switchStoreOutlet: (storeId: string) => void;

  // Realtime Active Orders Pipeline
  orders: Order[];
  isAlarmPlaying: boolean;
  orderFilter: 'ALL' | 'PLACED' | 'PREPARING' | 'READY_FOR_PICKUP';
  setOrderFilter: (filter: 'ALL' | 'PLACED' | 'PREPARING' | 'READY_FOR_PICKUP') => void;
  prepTimers: Record<string, { prepMinutes: number; acceptedAt: number }>;

  // Order Lifecycle Transitions
  acceptOrder: (orderId: string, prepMinutes: number) => Promise<void>;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  markOrderReady: (orderId: string) => Promise<void>;
  markOrderPrepared: (orderId: string) => Promise<void>;
  markRiderAssigned: (orderId: string, riderId?: string) => void;
  markOutForDelivery: (orderId: string) => void;
  handoverToRider: (orderId: string, riderName?: string) => Promise<void>;
  markDelivered: (orderId: string) => void;

  // Real-time Supabase Listeners
  initRealtimeSubscriptions: (storeId: string) => void;
  fetchStoreDataFromSupabase: (storeId: string) => Promise<void>;

  // Catalog & Inventory
  products: ProductInventoryItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  customCategories: string[];
  addCustomCategory: (cat: string) => void;
  toggleProductStock: (productId: string) => Promise<void>;
  toggleProductAvailability: (productId: string) => Promise<void>;
  updateProductPrice: (productId: string, pricePaise: number) => Promise<void>;
  updateProductStockCount: (productId: string, count: number) => Promise<void>;
  adjustProductStockCount: (productId: string, delta: number) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<ProductInventoryItem>) => Promise<void>;
  addProduct: (product: Omit<ProductInventoryItem, 'id' | 'storeId'>) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;

  // Operational Toggles
  isOnline: boolean;
  toggleStoreStatus: () => Promise<void>;
  setStoreStatus: (online: boolean) => Promise<void>;
  rushMode: boolean;
  toggleRushMode: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  gstPercent: number;
  setGstPercent: (val: number) => void;
  deliveryFeePaise: number;
  setDeliveryFeePaise: (paise: number) => void;

  // History & Ledger
  historicalGroups: HistoricalDateGroup[];

  // Modals
  prepModalOrderId: string | null;
  setPrepModalOrderId: (id: string | null) => void;
  rejectModalOrderId: string | null;
  setRejectModalOrderId: (id: string | null) => void;
  editingProduct: ProductInventoryItem | null;
  setEditingProduct: (prod: ProductInventoryItem | null) => void;
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;
  deletingProductId: string | null;
  setDeletingProductId: (id: string | null) => void;
}

// Global active realtime channel reference
let realtimeChannel: any = null;

export const useMerchantStore = create<MerchantState>((set, get) => ({
  // Auth state — Default starts on login screen
  isAuthenticated: false,
  merchantUser: null,
  activeStore: {
    id: 's1',
    name: 'Mhetha Stores',
    logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
    rating: 4.8,
    category: 'grocery',
    isOpen: false, // Initially OFFLINE
  },

  // ── 1. STRICT SUPABASE DATABASE AUTHENTICATION ──────────────────────────
  login: async (idOrName: string, password = '') => {
    const trimmedId = idOrName.trim();
    const cleanPass = password.trim();

    if (!trimmedId) {
      throw new Error('Please enter your Merchant User ID.');
    }
    if (!cleanPass) {
      throw new Error('Please enter your store password.');
    }

    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your .env credentials.');
    }

    // 1. Query Supabase `merchants` table matching `uid`
    const { data: merchants, error } = await supabase
      .from('merchants')
      .select('*, stores(*)')
      .ilike('uid', trimmedId)
      .limit(1);

    if (error) {
      console.error('Supabase auth error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!merchants || merchants.length === 0) {
      throw new Error(`Merchant ID "${trimmedId}" not found. Please check your User ID.`);
    }

    const m = merchants[0];

    // 2. Validate Password against database field
    if (m.password !== cleanPass) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }

    // 3. Extract store information
    let storeData = m.stores;
    if (!storeData && m.store_id) {
      const { data: sRes } = await supabase
        .from('stores')
        .select('*')
        .eq('id', m.store_id)
        .single();
      if (sRes) storeData = sRes;
    }

    const storeName = m.store_name || storeData?.name || m.name;
    const storeCategory = m.store_category || storeData?.category || 'grocery';
    const isStoreOnline = storeData?.is_online ?? false;

    const merchantUserObj: MerchantUser = {
      uid: m.uid,
      name: m.name,
      phone: m.phone || '+91 98450 11223',
      role: 'merchant',
      storeId: m.store_id,
      storeName: storeName,
      category: storeCategory,
    };

    const activeStoreObj: Store = {
      id: m.store_id,
      name: storeName,
      logoUrl: storeData?.logo_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300',
      rating: storeData?.rating || 4.8,
      category: storeCategory,
      isOpen: isStoreOnline,
    };

    set({
      isAuthenticated: true,
      merchantUser: merchantUserObj,
      activeStore: activeStoreObj,
      isOnline: isStoreOnline,
    });

    // 4. Fetch live products & orders, then start Realtime listener
    await get().fetchStoreDataFromSupabase(m.store_id);
    get().initRealtimeSubscriptions(m.store_id);

    return { success: true };
  },

  logout: async () => {
    const storeId = get().activeStore.id;
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    counterAudio.stopPendingOrderAlarm();

    // Update store is_online to false in Supabase
    if (isSupabaseConfigured && storeId) {
      try {
        await supabase
          .from('stores')
          .update({ is_online: false, updated_at: new Date().toISOString() })
          .eq('id', storeId);
      } catch (err) {
        console.warn('Error updating store offline on logout:', err);
      }
    }

    set((state) => ({
      isAuthenticated: false,
      merchantUser: null,
      isOnline: false,
      activeStore: { ...state.activeStore, isOpen: false },
      isAlarmPlaying: false,
      orders: [],
    }));
  },

  switchStoreOutlet: (storeId: string) => {
    const store = mockStores.find((s) => s.id === storeId);
    if (!store) return;
    const prods = mockProductsByStore[storeId] || [];

    set({
      activeStore: { ...store, isOpen: get().isOnline },
      products: prods,
    });

    if (isSupabaseConfigured) {
      get().initRealtimeSubscriptions(storeId);
      get().fetchStoreDataFromSupabase(storeId);
    }
  },

  // ── 2. REAL-TIME SUPABASE DATA & SUBSCRIPTIONS ────────────────────────────
  fetchStoreDataFromSupabase: async (storeId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      // 1. Fetch live store online status from DB
      const { data: storeInfo } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeInfo) {
        const online = storeInfo.is_online ?? false;
        set((state) => ({
          isOnline: online,
          activeStore: {
            ...state.activeStore,
            name: storeInfo.name || state.activeStore.name,
            isOpen: online,
          },
        }));
      }

      // 2. Fetch live products from DB
      const { data: dbProducts, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId);

      if (!prodError && dbProducts && dbProducts.length > 0) {
        const formattedProds: ProductInventoryItem[] = dbProducts.map((p) => ({
          id: p.id,
          storeId: p.store_id,
          name: p.name,
          price: p.price,
          imageUrl: p.image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300',
          category: p.category || 'General',
          deliveryEtaMinutes: p.delivery_eta_minutes || 10,
          inStock: p.in_stock ?? true,
          stockCount: p.stock_count ?? 100,
          availability: (p.in_stock ?? true) ? 'AVAILABLE' : 'OUT OF STOCK',
          description: p.description,
        }));
        set({ products: formattedProds });
      }

      // 3. Fetch live active orders from DB
      const { data: dbOrders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .in('status', ['PLACED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY'])
        .order('created_at', { ascending: false });

      if (!orderError && dbOrders) {
        const formattedOrders: Order[] = dbOrders.map((o) => ({
          id: o.id,
          customerId: o.customer_id || 'cust_guest',
          storeId: o.store_id,
          riderId: o.rider_id,
          status: o.status,
          items: Array.isArray(o.items) ? o.items : [],
          estimatedTotal: o.estimated_total,
          deliveryAddress: o.delivery_address || { label: 'Home', line1: 'KGF', city: 'KGF', pincode: '563122' },
          cookingInstructions: o.cooking_instructions,
          idempotencyKey: o.idempotency_key || `idemp-${o.id}`,
          createdAt: o.created_at || new Date().toISOString(),
          updatedAt: o.updated_at || new Date().toISOString(),
          paymentMethod: o.payment_method || 'UPI_NOW',
          recipientName: o.recipient_name || 'Customer',
          recipientPhone: o.recipient_phone || '+91 98450 00000',
        }));

        set({ orders: formattedOrders });

        // Check if any incoming orders need alarm
        const hasPending = formattedOrders.some((o) => o.status === 'PLACED');
        if (hasPending && get().isOnline) {
          counterAudio.playPendingOrderAlarm();
          set({ isAlarmPlaying: true });
        }
      }
    } catch (err) {
      console.warn('Error fetching store data from Supabase:', err);
    }
  },

  initRealtimeSubscriptions: (storeId: string) => {
    if (!isSupabaseConfigured) return;

    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    console.info(`⚡ [Realtime] Subscribing to live orders & store status for Store ID: ${storeId}`);

    realtimeChannel = supabase
      .channel(`merchant-counter-${storeId}`)
      // Listen to Orders table events
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          console.info('⚡ [Realtime Order Event]:', payload);

          if (payload.eventType === 'INSERT') {
            const newRaw = payload.new;
            const newOrder: Order = {
              id: newRaw.id,
              customerId: newRaw.customer_id || 'cust_guest',
              storeId: newRaw.store_id,
              riderId: newRaw.rider_id,
              status: newRaw.status || 'PLACED',
              items: Array.isArray(newRaw.items) ? newRaw.items : [],
              estimatedTotal: newRaw.estimated_total,
              deliveryAddress: newRaw.delivery_address || { label: 'Home', line1: 'KGF', city: 'KGF', pincode: '563122' },
              cookingInstructions: newRaw.cooking_instructions,
              idempotencyKey: newRaw.idempotency_key || `idemp-${newRaw.id}`,
              createdAt: newRaw.created_at || new Date().toISOString(),
              updatedAt: newRaw.updated_at || new Date().toISOString(),
              paymentMethod: 'UPI_NOW',
              recipientName: newRaw.recipient_name || 'Customer',
              recipientPhone: newRaw.recipient_phone || '+91 98450 00000',
            };

            set((state) => ({
              orders: [newOrder, ...state.orders.filter((o) => o.id !== newOrder.id)],
              isAlarmPlaying: true,
            }));

            // Ring alarm instantly
            counterAudio.playPendingOrderAlarm();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            set((state) => {
              // If marked delivered or rejected by another process, remove from live queue
              if (updated.status === 'DELIVERED' || updated.status === 'REJECTED') {
                return {
                  orders: state.orders.filter((o) => o.id !== updated.id),
                };
              }
              return {
                orders: state.orders.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
              };
            });
          }
        }
      )
      // Listen to Stores table changes in Realtime for is_online status
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${storeId}`,
        },
        (payload) => {
          console.info('⚡ [Realtime Store Status Event]:', payload);
          if (payload.new && typeof payload.new.is_online === 'boolean') {
            const online = payload.new.is_online;
            set((state) => ({
              isOnline: online,
              activeStore: { ...state.activeStore, isOpen: online },
            }));
          }
        }
      )
      .subscribe();
  },

  // ── 3. LIVE ORDER LIFECYCLE ───────────────────────────────────────────────
  orders: [],
  isAlarmPlaying: false,
  orderFilter: 'ALL',
  setOrderFilter: (filter) => set({ orderFilter: filter }),
  prepTimers: {},

  acceptOrder: async (orderId: string, prepMinutes: number) => {
    counterAudio.playActionChime();

    // Check if any other placed orders remain before stopping alarm
    const remainingPlaced = get().orders.filter((o) => o.id !== orderId && o.status === 'PLACED');
    if (remainingPlaced.length === 0) {
      counterAudio.stopPendingOrderAlarm();
      set({ isAlarmPlaying: false });
    }

    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'PREPARING' as const,
              updatedAt: new Date().toISOString(),
            }
          : ord
      ),
      prepTimers: {
        ...state.prepTimers,
        [orderId]: { prepMinutes, acceptedAt: Date.now() },
      },
      prepModalOrderId: null,
    }));

    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          status: 'PREPARING',
          prep_time_minutes: prepMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
  },

  markOrderPrepared: async (orderId: string) => {
    await get().markOrderReady(orderId);
  },

  rejectOrder: async (orderId: string, reason: string) => {
    counterAudio.playCancelSound();

    const remainingPlaced = get().orders.filter((o) => o.id !== orderId && o.status === 'PLACED');
    if (remainingPlaced.length === 0) {
      counterAudio.stopPendingOrderAlarm();
      set({ isAlarmPlaying: false });
    }

    const targetOrder = get().orders.find((o) => o.id === orderId);
    const remainingLiveOrders = get().orders.filter((o) => o.id !== orderId);

    if (targetOrder) {
      const rejectedOrder: Order = {
        ...targetOrder,
        status: 'CANCELLED',
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        orders: remainingLiveOrders,
        rejectModalOrderId: null,
        historicalGroups: state.historicalGroups.map((group, idx) => {
          if (idx === 0) {
            return {
              ...group,
              rejectedCount: (group.rejectedCount || 0) + 1,
              lostPaise: (group.lostPaise || 0) + rejectedOrder.estimatedTotal,
              orders: [rejectedOrder, ...group.orders],
            };
          }
          return group;
        }),
      }));
    }

    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          status: 'REJECTED',
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
  },

  markOrderReady: async (orderId: string) => {
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

    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          status: 'READY_FOR_PICKUP',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
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

  handoverToRider: async (orderId: string, _riderName = 'Suresh (SnapIt Rider)') => {
    counterAudio.unregisterOverdueOrder(orderId);
    counterAudio.playReadyDispatchChime();

    const targetOrder = get().orders.find((o) => o.id === orderId);
    const remainingLiveOrders = get().orders.filter((o) => o.id !== orderId);

    if (targetOrder) {
      const deliveredOrder: Order = {
        ...targetOrder,
        status: 'DELIVERED',
        deliveryVerified: true,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        orders: remainingLiveOrders,
        historicalGroups: state.historicalGroups.map((group, idx) => {
          if (idx === 0) {
            return {
              ...group,
              orderCount: group.orderCount + 1,
              collectedPaise: group.collectedPaise + deliveredOrder.estimatedTotal,
              orders: [deliveredOrder, ...group.orders],
            };
          }
          return group;
        }),
      }));
    }

    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          status: 'DELIVERED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
  },

  markDelivered: (orderId: string) => {
    get().handoverToRider(orderId);
  },

  // ── 4. CATALOG & INVENTORY (SYNCED WITH SUPABASE) ─────────────────────────
  products: mockProductsByStore['s1'],
  selectedCategory: 'ALL',
  setSelectedCategory: (cat: string) => set({ selectedCategory: cat }),
  customCategories: [
    'Noodles & Snacks',
    'Edible Oils',
    'Atta & Flours',
    'Milk & Curd',
    'Butter & Ghee',
    'Paneer & Cheese',
    'Soaps & Detergents',
    'Tea & Coffee',
    'Beverages',
  ],
  addCustomCategory: (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    set((state) => ({
      customCategories: state.customCategories.includes(trimmed)
        ? state.customCategories
        : [...state.customCategories, trimmed],
    }));
  },

  toggleProductStock: async (productId: string) => {
    await get().toggleProductAvailability(productId);
  },

  toggleProductAvailability: async (productId: string) => {
    const target = get().products.find((p) => p.id === productId);
    if (!target) return;

    const nextAvailability = target.availability === 'AVAILABLE' ? 'OUT OF STOCK' : 'AVAILABLE';
    const nextInStock = nextAvailability === 'AVAILABLE';
    const nextStockCount = nextInStock ? (target.stockCount > 0 ? target.stockCount : 50) : 0;

    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              availability: nextAvailability,
              inStock: nextInStock,
              stockCount: nextStockCount,
            }
          : p
      ),
    }));
    counterAudio.playActionChime();

    if (isSupabaseConfigured) {
      await supabase
        .from('products')
        .update({
          availability: nextAvailability,
          in_stock: nextInStock,
          stock_count: nextStockCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
    }
  },

  updateProductPrice: async (productId: string, pricePaise: number) => {
    if (pricePaise <= 0) return;
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, price: pricePaise } : p)),
    }));
    counterAudio.playActionChime();

    if (isSupabaseConfigured) {
      await supabase
        .from('products')
        .update({ price: pricePaise, updated_at: new Date().toISOString() })
        .eq('id', productId);
    }
  },

  updateProductStockCount: async (productId: string, count: number) => {
    const safeCount = Math.max(0, count);
    const nextInStock = safeCount > 0;
    const nextAvailability = nextInStock ? 'AVAILABLE' : 'OUT OF STOCK';

    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              stockCount: safeCount,
              inStock: nextInStock,
              availability: nextAvailability,
            }
          : p
      ),
    }));

    if (isSupabaseConfigured) {
      await supabase
        .from('products')
        .update({
          stock_count: safeCount,
          in_stock: nextInStock,
          availability: nextAvailability,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
    }
  },

  adjustProductStockCount: async (productId: string, delta: number) => {
    const target = get().products.find((p) => p.id === productId);
    if (!target) return;
    const nextCount = Math.max(0, target.stockCount + delta);
    await get().updateProductStockCount(productId, nextCount);
  },

  updateProduct: async (productId: string, updates: Partial<ProductInventoryItem>) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
      editingProduct: null,
    }));
    counterAudio.playActionChime();

    if (isSupabaseConfigured) {
      await supabase
        .from('products')
        .update({
          name: updates.name,
          price: updates.price,
          category: updates.category,
          stock_count: updates.stockCount,
          in_stock: updates.inStock,
          availability: updates.availability,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
    }
  },

  addProduct: async (newProdData) => {
    const newId = `p_${Date.now().toString().slice(-6)}`;
    const storeId = get().activeStore.id;
    const storeName = get().activeStore.name;
    const storeCategory = get().activeStore.category;

    const newProduct: ProductInventoryItem = {
      ...newProdData,
      id: newId,
      storeId,
      inStock: newProdData.availability === 'AVAILABLE',
    };

    set((state) => ({
      products: [newProduct, ...state.products],
      isAddProductOpen: false,
    }));
    counterAudio.playActionChime();

    if (isSupabaseConfigured) {
      await supabase.from('products').insert({
        id: newId,
        store_id: storeId,
        store_name: storeName,
        store_category: storeCategory,
        name: newProduct.name,
        price: newProduct.price,
        image_url: newProduct.imageUrl,
        category: newProduct.category,
        delivery_eta_minutes: newProduct.deliveryEtaMinutes,
        in_stock: newProduct.inStock,
        stock_count: newProduct.stockCount,
        availability: newProduct.availability,
        description: newProduct.description,
      });
    }
  },

  removeProduct: async (productId: string) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
      deletingProductId: null,
    }));
    counterAudio.playCancelSound();

    if (isSupabaseConfigured) {
      await supabase.from('products').delete().eq('id', productId);
    }
  },

  // ── 5. OPERATIONAL CONTROLS & REALTIME STORE STATUS ───────────────────────
  isOnline: false,
  toggleStoreStatus: async () => {
    const nextStatus = !get().isOnline;
    const storeId = get().activeStore.id;

    set((state) => ({
      isOnline: nextStatus,
      activeStore: { ...state.activeStore, isOpen: nextStatus },
    }));

    if (nextStatus) {
      counterAudio.playActionChime();
    }

    if (isSupabaseConfigured && storeId) {
      await supabase
        .from('stores')
        .update({ is_online: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', storeId);
    }
  },

  setStoreStatus: async (online: boolean) => {
    const storeId = get().activeStore.id;
    set((state) => ({
      isOnline: online,
      activeStore: { ...state.activeStore, isOpen: online },
    }));

    if (isSupabaseConfigured && storeId) {
      await supabase
        .from('stores')
        .update({ is_online: online, updated_at: new Date().toISOString() })
        .eq('id', storeId);
    }
  },

  rushMode: false,
  toggleRushMode: () => {
    const next = !get().rushMode;
    set({ rushMode: next });
    counterAudio.playActionChime();
  },

  isMuted: false,
  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  gstPercent: 0,
  setGstPercent: (val: number) => set({ gstPercent: val }),
  deliveryFeePaise: 0,
  setDeliveryFeePaise: (paise: number) => set({ deliveryFeePaise: paise }),

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

export default useMerchantStore;
