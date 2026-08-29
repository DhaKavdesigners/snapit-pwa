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
  orderFilter: 'ALL' | 'PLACED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_OF_SHOP';
  setOrderFilter: (filter: 'ALL' | 'PLACED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_OF_SHOP') => void;
  prepTimers: Record<string, { prepMinutes: number; acceptedAt: number }>;

  // Order Lifecycle Transitions
  acceptOrder: (orderId: string, prepMinutes: number) => Promise<void>;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  markOrderReady: (orderId: string) => Promise<void>;
  markOrderPrepared: (orderId: string) => Promise<void>;
  markRiderAssigned: (orderId: string, riderId?: string) => void;
  markOutForDelivery: (orderId: string) => void;
  handoverToRider: (orderId: string, riderName?: string) => Promise<void>;
  confirmRiderPickup: (orderId: string) => Promise<void>;
  markDelivered: (orderId: string) => Promise<void>;

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
  acknowledgedLowStockIds: string[];
  dismissLowStockAlert: () => void;

  // Operational Toggles (Synced with Supabase stores table)
  isOnline: boolean;
  toggleStoreStatus: () => Promise<void>;
  setStoreStatus: (online: boolean) => Promise<void>;
  rushMode: boolean;
  toggleRushMode: () => Promise<void>;
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

// Global active realtime channel and polling references
let realtimeChannel: any = null;
let pollInterval: any = null;

// Helper to compute pure goods/products sales value for an order (excludes customer delivery/service fees)
const computeOrderItemsTotal = (order: Order, prods: ProductInventoryItem[]) => {
  if (!order.items || order.items.length === 0) return order.estimatedTotal || 0;
  const subtotal = order.items.reduce((sum: number, it: any) => {
    if (it.name && it.price) {
      return sum + (it.price || 0) * (it.quantity || 1);
    }
    const p = prods.find((prod) => prod.id === (it.productId || it.id));
    return sum + (p ? p.price : it.price || 0) * (it.quantity || 1);
  }, 0);
  return subtotal > 0 ? subtotal : order.estimatedTotal || 0;
};

export const useMerchantStore = create<MerchantState>((set, get) => ({
  // Auth state — Default starts on login screen
  isAuthenticated: false,
  merchantUser: null,
  activeStore: {
    id: 'g1',
    name: 'Mhetha Stores',
    logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
    rating: 4.8,
    category: 'grocery',
    isOpen: false, // Initially OFFLINE
    address: 'Robertsonpet, KGF',
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
    const storeAddress = storeData?.store_address || storeData?.address || 'KGF Dark Store Region';
    const isStoreOnline = storeData?.is_online ?? false;
    const isRushMode = storeData?.rush_mode ?? false;

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
      address: storeAddress,
    };

    set({
      isAuthenticated: true,
      merchantUser: merchantUserObj,
      activeStore: activeStoreObj,
      isOnline: isStoreOnline,
      rushMode: isRushMode,
    });

    // 4. Fetch live products & orders, then start Realtime listener
    await get().fetchStoreDataFromSupabase(m.store_id);
    get().initRealtimeSubscriptions(m.store_id);

    return { success: true };
  },

  logout: async () => {
    const storeId = get().activeStore.id;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    counterAudio.stopPendingOrderAlarm();

    // Update store is_online to false and rush_mode to false in Supabase
    if (isSupabaseConfigured && storeId) {
      try {
        await supabase
          .from('stores')
          .update({
            is_online: false,
            rush_mode: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storeId);
      } catch (err) {
        console.warn('Error updating store offline on logout:', err);
      }
    }

    set((state) => ({
      isAuthenticated: false,
      merchantUser: null,
      isOnline: false,
      rushMode: false,
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
      // 1. Fetch live store online and rush_mode status from DB
      const { data: storeInfo } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeInfo) {
        const online = storeInfo.is_online ?? false;
        const rush = storeInfo.rush_mode ?? false;
        const storeAddr = storeInfo.store_address || storeInfo.address || 'KGF Dark Store Region';
        const currentStore = get().activeStore;

        if (
          get().isOnline !== online ||
          get().rushMode !== rush ||
          currentStore.isOpen !== online ||
          currentStore.address !== storeAddr ||
          currentStore.name !== (storeInfo.name || currentStore.name)
        ) {
          set((state) => ({
            isOnline: online,
            rushMode: rush,
            activeStore: {
              ...state.activeStore,
              name: storeInfo.name || state.activeStore.name,
              isOpen: online,
              address: storeAddr,
            },
          }));
        }
      }

      // 2. Fetch live products from DB (skip if user is actively in the edit modal)
      if (!get().editingProduct && !get().isAddProductOpen) {
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
      }

      // 3. Fetch live active orders from DB (Active until OUT_OF_SHOP is acknowledged by rider)
      const { data: dbOrders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .in('status', ['PENDING', 'PLACED', 'PAID', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_OF_SHOP'])
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
          if (!get().isAlarmPlaying) {
            counterAudio.playPendingOrderAlarm();
            set({ isAlarmPlaying: true });
          }
        } else {
          // If NO pending placed orders remain, guarantee the alarm is stopped!
          counterAudio.stopPendingOrderAlarm();
          if (get().isAlarmPlaying) {
            set({ isAlarmPlaying: false });
          }
        }
      }

      // 4. Fetch completed / archived / settled orders from DB for this store (Rider in transit or delivered)
      const { data: dbCompletedOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .in('status', ['OUT_FOR_DELIVERY', 'PICKED_UP', 'RIDER_AT_LOC', 'DELIVERED', 'REJECTED', 'CANCELLED'])
        .order('created_at', { ascending: false });

      if (dbCompletedOrders) {
        const now = new Date();
        const todayDateStr = now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDateStr = yesterday.toDateString();

        // Map dateKey -> Order[]
        const groupsMap = new Map<string, Order[]>();

        for (const o of dbCompletedOrders) {
          const createdAt = o.created_at || new Date().toISOString();
          const d = new Date(createdAt);
          let dateKey = '';

          if (d.toDateString() === todayDateStr) {
            dateKey = 'Today (Live Activity)';
          } else if (d.toDateString() === yesterdayDateStr) {
            dateKey = `Yesterday (${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`;
          } else {
            dateKey = `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • ${d.toLocaleDateString('en-GB', { weekday: 'long' })}`;
          }

          const formatted: Order = {
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
          };

          if (!groupsMap.has(dateKey)) {
            groupsMap.set(dateKey, []);
          }
          groupsMap.get(dateKey)!.push(formatted);
        }

        const formattedGroups: HistoricalDateGroup[] = [];
        // Ensure "Today (Live Activity)" is always first
        const todayOrders = groupsMap.get('Today (Live Activity)') || [];
        const todayFulfilled = todayOrders.filter((o) => o.status !== 'CANCELLED' && (o.status as any) !== 'REJECTED');
        const todayRejected = todayOrders.filter((o) => (o.status as any) === 'REJECTED' || o.status === 'CANCELLED');

        const currentProds = get().products;
        formattedGroups.push({
          dateKey: 'Today (Live Activity)',
          orderCount: todayFulfilled.length,
          collectedPaise: todayFulfilled.reduce((sum, o) => sum + computeOrderItemsTotal(o, currentProds), 0),
          rejectedCount: todayRejected.length,
          lostPaise: todayRejected.reduce((sum, o) => sum + computeOrderItemsTotal(o, currentProds), 0),
          orders: todayOrders,
        });

        // Add all previous day groups
        for (const [key, ords] of groupsMap.entries()) {
          if (key === 'Today (Live Activity)') continue;
          const fulfilled = ords.filter((o) => o.status !== 'CANCELLED' && (o.status as any) !== 'REJECTED');
          const rejected = ords.filter((o) => (o.status as any) === 'REJECTED' || o.status === 'CANCELLED');
          formattedGroups.push({
            dateKey: key,
            orderCount: fulfilled.length,
            collectedPaise: fulfilled.reduce((sum, o) => sum + computeOrderItemsTotal(o, currentProds), 0),
            rejectedCount: rejected.length,
            lostPaise: rejected.reduce((sum, o) => sum + computeOrderItemsTotal(o, currentProds), 0),
            orders: ords,
          });
        }

        set({ historicalGroups: formattedGroups });
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
      // 1. Listen to Orders table events
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
              // If status becomes OUT_FOR_DELIVERY, PICKED_UP, RIDER_AT_LOC, DELIVERED, REJECTED, or CANCELLED,
              // the merchant counter task is officially complete -> remove from live orders and move to history!
              if (
                updated.status === 'OUT_FOR_DELIVERY' ||
                updated.status === 'PICKED_UP' ||
                updated.status === 'RIDER_AT_LOC' ||
                updated.status === 'DELIVERED' ||
                updated.status === 'REJECTED' ||
                updated.status === 'CANCELLED'
              ) {
                const target = state.orders.find((o) => o.id === updated.id);
                const remaining = state.orders.filter((o) => o.id !== updated.id);

                if (target) {
                  const completedOrder: Order = {
                    ...target,
                    status: updated.status,
                    updatedAt: updated.updated_at || new Date().toISOString(),
                  };

                  counterAudio.playReadyDispatchChime();

                  return {
                    orders: remaining,
                    historicalGroups: state.historicalGroups.map((group, idx) => {
                      if (idx === 0) {
                        const isDeliveredOrTransit =
                          updated.status === 'OUT_FOR_DELIVERY' ||
                          updated.status === 'PICKED_UP' ||
                          updated.status === 'RIDER_AT_LOC' ||
                          updated.status === 'DELIVERED';
                        
                        const alreadyExists = group.orders.some((o) => o.id === completedOrder.id);
                        const updatedOrders = alreadyExists
                          ? group.orders.map((o) => (o.id === completedOrder.id ? completedOrder : o))
                          : [completedOrder, ...group.orders];

                        return {
                          ...group,
                          orderCount: alreadyExists ? group.orderCount : (isDeliveredOrTransit ? group.orderCount + 1 : group.orderCount),
                          collectedPaise: alreadyExists ? group.collectedPaise : (isDeliveredOrTransit ? group.collectedPaise + computeOrderItemsTotal(completedOrder, state.products) : group.collectedPaise),
                          rejectedCount: alreadyExists ? group.rejectedCount : (!isDeliveredOrTransit ? (group.rejectedCount || 0) + 1 : group.rejectedCount),
                          lostPaise: alreadyExists ? (group.lostPaise || 0) : (!isDeliveredOrTransit ? (group.lostPaise || 0) + computeOrderItemsTotal(completedOrder, state.products) : (group.lostPaise || 0)),
                          orders: updatedOrders,
                        };
                      }
                      return group;
                    }),
                  };
                }

                // If order was already moved to historical groups, update its status there
                return {
                  orders: remaining,
                  historicalGroups: state.historicalGroups.map((group) => ({
                    ...group,
                    orders: group.orders.map((o) =>
                      o.id === updated.id
                        ? { ...o, status: updated.status, updatedAt: updated.updated_at || new Date().toISOString() }
                        : o
                    ),
                  })),
                };
              }

              // Otherwise (e.g. status changed to OUT_OF_SHOP), keep live and update state
              return {
                orders: state.orders.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
              };
            });

            // Ensure pending order alarm stops if no PLACED orders remain after realtime update
            setTimeout(() => {
              const liveOrders = get().orders;
              const hasPlaced = liveOrders.some((o) => o.status === 'PLACED');
              if (!hasPlaced) {
                counterAudio.stopPendingOrderAlarm();
                if (get().isAlarmPlaying) {
                  set({ isAlarmPlaying: false });
                }
              }
            }, 10);
          }
        }
      )
      // 2. Listen to Stores table changes in Realtime for is_online & rush_mode
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
          if (payload.new) {
            const online = typeof payload.new.is_online === 'boolean' ? payload.new.is_online : get().isOnline;
            const rush = typeof payload.new.rush_mode === 'boolean' ? payload.new.rush_mode : get().rushMode;

            set((state) => ({
              isOnline: online,
              rushMode: rush,
              activeStore: { ...state.activeStore, isOpen: online },
            }));
          }
        }
      )
      .subscribe();

    // 3. Fallback High-Reliability Poller (Syncs every 2.5s)
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    pollInterval = setInterval(() => {
      if (get().isAuthenticated) {
        get().fetchStoreDataFromSupabase(storeId);
      }
    }, 2500);
  },

  // ── 3. LIVE ORDER LIFECYCLE ───────────────────────────────────────────────
  orders: [],
  isAlarmPlaying: false,
  orderFilter: 'ALL',
  setOrderFilter: (filter) => set({ orderFilter: filter }),
  prepTimers: {},

  acceptOrder: async (orderId: string, prepMinutes: number) => {
    counterAudio.playActionChime();

    // Find the target order to inspect items
    const targetOrder = get().orders.find((o) => o.id === orderId);

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

    // Deduct stock in real time for each ordered product
    if (targetOrder && Array.isArray(targetOrder.items) && targetOrder.items.length > 0) {
      const currentProducts = [...get().products];
      const updatedProductsMap = new Map<
        string,
        { newStock: number; inStock: boolean; availability: 'AVAILABLE' | 'OUT OF STOCK' | 'UNLISTED' }
      >();

      for (const rawItem of targetOrder.items as any[]) {
        const pId = rawItem.productId || rawItem.product_id || rawItem.id;
        const pName = (rawItem.name || rawItem.product_name || rawItem.title || '').trim().toLowerCase();
        const qty = Number(rawItem.quantity || rawItem.qty || 1);

        const prod = currentProducts.find(
          (p) => (pId && p.id === pId) || (pName && p.name.trim().toLowerCase() === pName)
        );

        if (prod) {
          const currentCount = prod.stockCount ?? 10;
          const newStock = Math.max(0, currentCount - qty);
          const inStock = newStock > 0;
          const availability = inStock ? ('AVAILABLE' as const) : ('OUT OF STOCK' as const);

          updatedProductsMap.set(prod.id, { newStock, inStock, availability });
        }
      }

      // 1. Update local store products state immediately
      if (updatedProductsMap.size > 0) {
        set((state) => ({
          products: state.products.map((p) => {
            const upd = updatedProductsMap.get(p.id);
            if (upd) {
              return {
                ...p,
                stockCount: upd.newStock,
                inStock: upd.inStock,
                availability: upd.availability,
              };
            }
            return p;
          }),
        }));

        // 2. Persist updated stock in Supabase database
        if (isSupabaseConfigured) {
          for (const [prodId, upd] of updatedProductsMap.entries()) {
            try {
              await supabase
                .from('products')
                .update({
                  stock_count: upd.newStock,
                  in_stock: upd.inStock,
                  availability: upd.availability,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', prodId);
              console.info(`📦 [Inventory] Deducted stock for product ${prodId}. New stock: ${upd.newStock}`);
            } catch (err) {
              console.warn(`Error updating stock for ${prodId}:`, err);
            }
          }
        }
      }
    }

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
    counterAudio.playActionChime();

    // Set status to OUT_OF_SHOP (order remains in Live Orders queue awaiting rider confirmation)
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'OUT_OF_SHOP' as const,
              updatedAt: new Date().toISOString(),
            }
          : ord
      ),
    }));

    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          status: 'OUT_OF_SHOP',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
  },

  confirmRiderPickup: async (orderId: string) => {
    counterAudio.playReadyDispatchChime();

    const targetOrder = get().orders.find((o) => o.id === orderId);
    const remainingLiveOrders = get().orders.filter((o) => o.id !== orderId);

    if (targetOrder) {
      const outForDeliveryOrder: Order = {
        ...targetOrder,
        status: 'OUT_FOR_DELIVERY',
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        orders: remainingLiveOrders,
        historicalGroups: state.historicalGroups.map((group, idx) => {
          if (idx === 0) {
              return {
                ...group,
                orderCount: group.orderCount + 1,
                collectedPaise: group.collectedPaise + computeOrderItemsTotal(outForDeliveryOrder, state.products),
                orders: [outForDeliveryOrder, ...group.orders.filter((o) => o.id !== outForDeliveryOrder.id)],
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
          status: 'OUT_FOR_DELIVERY',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
  },

  markDelivered: async (orderId: string) => {
    counterAudio.playReadyDispatchChime();

    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
      historicalGroups: state.historicalGroups.map((group) => ({
        ...group,
        orders: group.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: 'DELIVERED' as const, deliveryVerified: true, updatedAt: new Date().toISOString() }
            : o
        ),
      })),
    }));

    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          status: 'DELIVERED',
          delivery_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
  },

  // ── 4. CATALOG & INVENTORY (SYNCED WITH SUPABASE) ─────────────────────────
  products: mockProductsByStore['g1'],
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

  acknowledgedLowStockIds: [],
  dismissLowStockAlert: () => {
    const currentLowIds = get().products
      .filter((p) => p.stockCount > 0 && p.stockCount <= 3 && p.availability === 'AVAILABLE' && p.inStock !== false)
      .map((p) => p.id);
    set((state) => ({
      acknowledgedLowStockIds: Array.from(new Set([...state.acknowledgedLowStockIds, ...currentLowIds])),
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
      acknowledgedLowStockIds: nextStockCount > 3 || nextStockCount === 0
        ? state.acknowledgedLowStockIds.filter((id) => id !== productId)
        : state.acknowledgedLowStockIds,
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
      // If stock is replenished (> 3) or set to 0, clear it from acknowledged list
      acknowledgedLowStockIds: safeCount > 3 || safeCount === 0
        ? state.acknowledgedLowStockIds.filter((id) => id !== productId)
        : state.acknowledgedLowStockIds,
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
    // When turning store offline, also turn rush mode off
    const nextRush = nextStatus ? get().rushMode : false;

    set((state) => ({
      isOnline: nextStatus,
      rushMode: nextRush,
      activeStore: { ...state.activeStore, isOpen: nextStatus },
    }));

    if (nextStatus) {
      counterAudio.playActionChime();
    }

    if (isSupabaseConfigured && storeId) {
      await supabase
        .from('stores')
        .update({
          is_online: nextStatus,
          rush_mode: nextRush,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);
    }
  },

  setStoreStatus: async (online: boolean) => {
    const storeId = get().activeStore.id;
    const nextRush = online ? get().rushMode : false;

    set((state) => ({
      isOnline: online,
      rushMode: nextRush,
      activeStore: { ...state.activeStore, isOpen: online },
    }));

    if (isSupabaseConfigured && storeId) {
      await supabase
        .from('stores')
        .update({
          is_online: online,
          rush_mode: nextRush,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);
    }
  },

  rushMode: false,
  toggleRushMode: async () => {
    // Only allow toggling rush mode when store is ONLINE
    if (!get().isOnline) return;

    const nextRush = !get().rushMode;
    const storeId = get().activeStore.id;

    set({ rushMode: nextRush });
    counterAudio.playActionChime();

    if (isSupabaseConfigured && storeId) {
      try {
        await supabase
          .from('stores')
          .update({
            rush_mode: nextRush,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storeId);
      } catch (err) {
        console.warn('Error updating rush mode in Supabase:', err);
      }
    }
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
  setPrepModalOrderId: (id) => {
    if (id) {
      const remainingPlaced = get().orders.filter((o) => o.id !== id && o.status === 'PLACED');
      if (remainingPlaced.length === 0) {
        counterAudio.stopPendingOrderAlarm();
        if (get().isAlarmPlaying) {
          set({ isAlarmPlaying: false });
        }
      }
    }
    set({ prepModalOrderId: id });
  },
  rejectModalOrderId: null,
  setRejectModalOrderId: (id) => {
    if (id) {
      const remainingPlaced = get().orders.filter((o) => o.id !== id && o.status === 'PLACED');
      if (remainingPlaced.length === 0) {
        counterAudio.stopPendingOrderAlarm();
        if (get().isAlarmPlaying) {
          set({ isAlarmPlaying: false });
        }
      }
    }
    set({ rejectModalOrderId: id });
  },
  editingProduct: null,
  setEditingProduct: (prod) => set({ editingProduct: prod }),
  isAddProductOpen: false,
  setIsAddProductOpen: (open) => set({ isAddProductOpen: open }),
  deletingProductId: null,
  setDeletingProductId: (id) => set({ deletingProductId: id }),
}));

export default useMerchantStore;
