import { create } from "zustand";
import { supabase } from "../lib/supabase";
import {
  AdminOrder,
  AdminStore,
  AdminMerchant,
  StoreSettlementRecord,
  AdminRider,
  AdminProduct,
  AdminCustomerProfile,
  OrderStatus,
} from "../types/admin";

interface AdminState {
  orders: AdminOrder[];
  stores: AdminStore[];
  merchants: AdminMerchant[];
  settlements: StoreSettlementRecord[];
  riders: AdminRider[];
  products: AdminProduct[];
  customers: AdminCustomerProfile[];
  isLoading: boolean;
  isRealtimeConnected: boolean;
  lastSyncTime: string | null;
  error: string | null;

  // Initializers
  fetchInitialData: () => Promise<void>;
  initRealtimeSubscription: () => () => void;

  // Order Actions
  assignRiderToOrder: (orderId: string, riderId: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<boolean>;
  reassignStore: (orderId: string, newStoreId: string) => Promise<boolean>;

  // Store & Merchant Actions
  createStore: (data: Partial<AdminStore>) => Promise<boolean>;
  createStoreWithMerchant: (
    storeData: Partial<AdminStore>,
    merchantData: { uid: string; password: string; name: string; phone?: string }
  ) => Promise<boolean>;
  updateStore: (storeId: string, updates: Partial<AdminStore>) => Promise<boolean>;
  toggleStoreOnline: (storeId: string, isOnline: boolean) => Promise<boolean>;
  toggleStoreRushMode: (storeId: string, rushMode: boolean) => Promise<boolean>;
  deleteStore: (storeId: string) => Promise<boolean>;
  updateMerchantCredentials: (merchantId: string, updates: Partial<AdminMerchant>) => Promise<boolean>;
  createMerchantForStore: (
    storeId: string,
    data: { uid: string; password: string; name: string; phone?: string }
  ) => Promise<boolean>;

  // Ledger & Settlement Actions
  recordStorePayout: (record: Omit<StoreSettlementRecord, "id" | "settled_at">) => Promise<boolean>;

  // Rider Actions
  createRider: (data: Partial<AdminRider>) => Promise<boolean>;
  updateRider: (riderId: string, updates: Partial<AdminRider>) => Promise<boolean>;
  toggleRiderOnline: (riderId: string, isOnline: boolean) => Promise<boolean>;
  resetRiderBusy: (riderId: string) => Promise<boolean>;
  deleteRider: (riderId: string) => Promise<boolean>;

  // Product Actions
  createProduct: (data: Partial<AdminProduct>) => Promise<boolean>;
  updateProduct: (productId: string, updates: Partial<AdminProduct>) => Promise<boolean>;
  toggleProductStock: (productId: string, inStock: boolean) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;

  // Customer Actions
  updateCustomerVerification: (customerId: string, verified: boolean) => Promise<boolean>;
}

const getStoredSettlements = (): StoreSettlementRecord[] => {
  try {
    const raw = localStorage.getItem("snapit_admin_store_settlements");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Error reading stored settlements:", e);
  }
  return [];
};

export const useAdminStore = create<AdminState>((set, get) => ({
  orders: [],
  stores: [],
  merchants: [],
  settlements: getStoredSettlements(),
  riders: [],
  products: [],
  customers: [],
  isLoading: true,
  isRealtimeConnected: false,
  lastSyncTime: null,
  error: null,

  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [
        ordersRes,
        storesRes,
        merchantsRes,
        ridersRes,
        productsRes,
        customersRes,
      ] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("stores").select("*").order("name", { ascending: true }),
        supabase.from("merchants").select("*").order("name", { ascending: true }),
        supabase.from("rider_profiles").select("*").order("name", { ascending: true }),
        supabase.from("products").select("*").order("name", { ascending: true }).limit(500),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      // Normalize stores so store_address and address are unified
      const normalizedStores = ((storesRes.data as any[]) || []).map((s) => ({
        ...s,
        address: s.store_address || s.address || "KGF Dark Store Region",
        store_address: s.store_address || s.address || "KGF Dark Store Region",
      }));

      set({
        orders: (ordersRes.data as AdminOrder[]) || [],
        stores: normalizedStores as AdminStore[],
        merchants: (merchantsRes.data as AdminMerchant[]) || [],
        riders: (ridersRes.data as AdminRider[]) || [],
        products: (productsRes.data as AdminProduct[]) || [],
        customers: (customersRes.data as AdminCustomerProfile[]) || [],
        isLoading: false,
        lastSyncTime: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error("Admin data fetch error:", err);
      set({ isLoading: false, error: err.message || "Failed to load data" });
    }
  },

  initRealtimeSubscription: () => {
    console.log("⚡ [Admin] Initializing global Postgres realtime subscription...");

    const channel = supabase
      .channel("admin-command-center-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("⚡ [Admin] Orders update received:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            let updated = [...state.orders];
            if (eventType === "INSERT") {
              updated = [newRecord as AdminOrder, ...updated];
            } else if (eventType === "UPDATE") {
              updated = updated.map((o) => (o.id === newRecord.id ? (newRecord as AdminOrder) : o));
            } else if (eventType === "DELETE") {
              updated = updated.filter((o) => o.id !== oldRecord.id);
            }
            return { orders: updated, lastSyncTime: new Date().toLocaleTimeString() };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stores" },
        (payload) => {
          console.log("⚡ [Admin] Stores update received:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            let updated = [...state.stores];
            const normalizedNew = newRecord ? {
              ...(newRecord as any),
              address: (newRecord as any).store_address || (newRecord as any).address,
              store_address: (newRecord as any).store_address || (newRecord as any).address,
            } : null;

            if (eventType === "INSERT" && normalizedNew) {
              updated = [...updated, normalizedNew as AdminStore];
            } else if (eventType === "UPDATE" && normalizedNew) {
              updated = updated.map((s) => (s.id === normalizedNew.id ? (normalizedNew as AdminStore) : s));
            } else if (eventType === "DELETE") {
              updated = updated.filter((s) => s.id !== oldRecord.id);
            }
            return { stores: updated, lastSyncTime: new Date().toLocaleTimeString() };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "merchants" },
        (payload) => {
          console.log("⚡ [Admin] Merchants update received:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            let updated = [...state.merchants];
            if (eventType === "INSERT") {
              updated = [...updated, newRecord as AdminMerchant];
            } else if (eventType === "UPDATE") {
              updated = updated.map((m) => (m.id === newRecord.id ? (newRecord as AdminMerchant) : m));
            } else if (eventType === "DELETE") {
              updated = updated.filter((m) => m.id !== oldRecord.id);
            }
            return { merchants: updated, lastSyncTime: new Date().toLocaleTimeString() };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rider_profiles" },
        (payload) => {
          console.log("⚡ [Admin] Riders update received:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            let updated = [...state.riders];
            if (eventType === "INSERT") {
              updated = [...updated, newRecord as AdminRider];
            } else if (eventType === "UPDATE") {
              updated = updated.map((r) => (r.id === newRecord.id ? (newRecord as AdminRider) : r));
            } else if (eventType === "DELETE") {
              updated = updated.filter((r) => r.id !== oldRecord.id);
            }
            return { riders: updated, lastSyncTime: new Date().toLocaleTimeString() };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("⚡ [Admin] Products update received:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            let updated = [...state.products];
            if (eventType === "INSERT") {
              updated = [newRecord as AdminProduct, ...updated];
            } else if (eventType === "UPDATE") {
              updated = updated.map((p) => (p.id === newRecord.id ? (newRecord as AdminProduct) : p));
            } else if (eventType === "DELETE") {
              updated = updated.filter((p) => p.id !== oldRecord.id);
            }
            return { products: updated, lastSyncTime: new Date().toLocaleTimeString() };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("⚡ [Admin] Customer profiles update received:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            let updated = [...state.customers];
            if (eventType === "INSERT") {
              updated = [newRecord as AdminCustomerProfile, ...updated];
            } else if (eventType === "UPDATE") {
              updated = updated.map((c) => (c.id === newRecord.id ? (newRecord as AdminCustomerProfile) : c));
            } else if (eventType === "DELETE") {
              updated = updated.filter((c) => c.id !== oldRecord.id);
            }
            return { customers: updated, lastSyncTime: new Date().toLocaleTimeString() };
          });
        }
      )
      .subscribe((status) => {
        set({ isRealtimeConnected: status === "SUBSCRIBED" });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ---------------- ORDER ACTIONS ----------------
  assignRiderToOrder: async (orderId: string, riderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          rider_id: riderId,
          status: "OUT_FOR_DELIVERY",
        })
        .eq("id", orderId);

      if (error) throw error;

      // Update rider busy status
      await supabase
        .from("rider_profiles")
        .update({ is_busy: true, current_order_id: orderId })
        .eq("id", riderId);

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, rider_id: riderId, status: "OUT_FOR_DELIVERY" } : o
        ),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to assign rider:", err);
      return false;
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
      const payload: any = { status };
      if (reason) payload.rejection_reason = reason;

      const { error } = await supabase.from("orders").update(payload).eq("id", orderId);
      if (error) throw error;

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, status, ...(reason ? { rejection_reason: reason } : {}) } : o
        ),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to update status:", err);
      return false;
    }
  },

  reassignStore: async (orderId: string, newStoreId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ store_id: newStoreId })
        .eq("id", orderId);
      if (error) throw error;

      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? { ...o, store_id: newStoreId } : o)),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to reassign store:", err);
      return false;
    }
  },

  // ---------------- STORE & MERCHANT ACTIONS ----------------
  createStore: async (data: Partial<AdminStore>) => {
    try {
      const id = data.id || `store_${Date.now()}`;
      const category = (data.category || "GROCERY").toUpperCase();
      const address = data.store_address || data.address || "KGF Dark Store Region";

      const { error } = await supabase.from("stores").insert({
        id,
        name: data.name,
        category: category,
        logo_url: data.logo_url || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300",
        rating: data.rating || 4.8,
        is_online: data.is_online !== undefined ? data.is_online : true,
        rush_mode: data.rush_mode ?? false,
        store_address: address,
        store_location: data.store_location || null,
        lat: data.lat || 12.9785,
        lng: data.lng || 77.645,
        phone: data.phone || "8217649688",
        landmark: data.landmark || null,
      });

      if (error) throw error;
      await get().fetchInitialData();
      return true;
    } catch (err: any) {
      console.error("Failed to create store:", err);
      return false;
    }
  },

  createStoreWithMerchant: async (storeData, merchantData) => {
    try {
      const storeId = storeData.id || `store_${Date.now()}`;
      const category = (storeData.category || "GROCERY").toUpperCase();
      const address = storeData.store_address || storeData.address || "Robertsonpet, KGF";

      // 1. Create Store in stores table
      const { error: storeError } = await supabase.from("stores").insert({
        id: storeId,
        name: storeData.name,
        category: category,
        logo_url: storeData.logo_url || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300",
        rating: storeData.rating || 4.8,
        is_online: storeData.is_online !== undefined ? storeData.is_online : true,
        rush_mode: storeData.rush_mode ?? false,
        store_address: address,
        store_location: storeData.store_location || null,
        lat: storeData.lat || 12.9785,
        lng: storeData.lng || 77.645,
        phone: storeData.phone || merchantData.phone || "8217649688",
        landmark: storeData.landmark || null,
      });
      if (storeError) throw storeError;

      // 2. Create Merchant Account in merchants table
      const merchantId = `m_${storeId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;
      const cleanUid = (merchantData.uid || merchantId).trim();
      const cleanPassword = (merchantData.password || "store123").trim();

      const { error: merchantError } = await supabase.from("merchants").insert({
        id: merchantId,
        uid: cleanUid,
        password: cleanPassword,
        store_id: storeId,
        name: merchantData.name || `${storeData.name} Admin`,
        phone: merchantData.phone || storeData.phone || "8217649688",
        role: "MERCHANT_OWNER",
      });
      if (merchantError) {
        console.warn("Notice: Store created, but error creating merchant account:", merchantError);
      }

      await get().fetchInitialData();
      return true;
    } catch (err: any) {
      console.error("Failed to create store with merchant:", err);
      return false;
    }
  },

  updateStore: async (storeId: string, updates: Partial<AdminStore>) => {
    try {
      const payload: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      if (updates.address && !updates.store_address) {
        payload.store_address = updates.address;
      }
      delete payload.address;
      delete payload.upi_id;

      const { error } = await supabase.from("stores").update(payload).eq("id", storeId);
      if (error) throw error;

      set((state) => ({
        stores: state.stores.map((s) => (s.id === storeId ? { ...s, ...updates } : s)),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to update store:", err);
      return false;
    }
  },

  toggleStoreOnline: async (storeId: string, isOnline: boolean) => {
    try {
      const { error } = await supabase
        .from("stores")
        .update({ is_online: isOnline, updated_at: new Date().toISOString() })
        .eq("id", storeId);
      if (error) throw error;

      set((state) => ({
        stores: state.stores.map((s) => (s.id === storeId ? { ...s, is_online: isOnline } : s)),
      }));
      return true;
    } catch (err: any) {
      console.error("Failed to toggle store online:", err);
      return false;
    }
  },

  toggleStoreRushMode: async (storeId: string, rushMode: boolean) => {
    try {
      const { error } = await supabase
        .from("stores")
        .update({ rush_mode: rushMode, updated_at: new Date().toISOString() })
        .eq("id", storeId);
      if (error) throw error;

      set((state) => ({
        stores: state.stores.map((s) => (s.id === storeId ? { ...s, rush_mode: rushMode } : s)),
      }));
      return true;
    } catch (err: any) {
      console.error("Failed to toggle rush mode:", err);
      return false;
    }
  },

  updateMerchantCredentials: async (merchantId: string, updates: Partial<AdminMerchant>) => {
    try {
      const { error } = await supabase.from("merchants").update(updates).eq("id", merchantId);
      if (error) throw error;

      set((state) => ({
        merchants: state.merchants.map((m) => (m.id === merchantId ? { ...m, ...updates } : m)),
      }));
      return true;
    } catch (err: any) {
      console.error("Failed to update merchant credentials:", err);
      return false;
    }
  },

  createMerchantForStore: async (storeId: string, data) => {
    try {
      const merchantId = `m_${storeId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}_${Date.now().toString().slice(-4)}`;
      const { error } = await supabase.from("merchants").insert({
        id: merchantId,
        uid: data.uid.trim(),
        password: data.password.trim(),
        store_id: storeId,
        name: data.name.trim(),
        phone: data.phone?.trim() || "8217649688",
        role: "MERCHANT_OWNER",
      });
      if (error) throw error;

      await get().fetchInitialData();
      return true;
    } catch (err: any) {
      console.error("Failed to create merchant for store:", err);
      return false;
    }
  },

  deleteStore: async (storeId: string) => {
    try {
      // 1. Delete associated merchants
      await supabase.from("merchants").delete().eq("store_id", storeId);
      // 2. Delete associated products
      await supabase.from("products").delete().eq("store_id", storeId);
      // 3. Delete store
      const { error } = await supabase.from("stores").delete().eq("id", storeId);
      if (error) throw error;

      set((state) => ({
        stores: state.stores.filter((s) => s.id !== storeId),
        merchants: state.merchants.filter((m) => m.store_id !== storeId),
        products: state.products.filter((p) => p.store_id !== storeId),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to delete store:", err);
      return false;
    }
  },

  // ---------------- LEDGER & SETTLEMENT ACTIONS ----------------
  recordStorePayout: async (recordData) => {
    try {
      const newRecord: StoreSettlementRecord = {
        id: `set_${Date.now()}`,
        settled_at: new Date().toISOString(),
        ...recordData,
      };

      set((state) => {
        const updated = [newRecord, ...state.settlements];
        try {
          localStorage.setItem("snapit_admin_store_settlements", JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not persist to localStorage:", e);
        }
        return { settlements: updated };
      });

      return true;
    } catch (err: any) {
      console.error("Failed to record store payout:", err);
      return false;
    }
  },

  // ---------------- RIDER ACTIONS ----------------
  createRider: async (data: Partial<AdminRider>) => {
    try {
      const id = data.id || `rider_${Date.now()}`;
      const { error } = await supabase.from("rider_profiles").insert({
        id,
        name: data.name,
        phone: data.phone,
        vehicle_type: data.vehicle_type || "Bike",
        vehicle_number: data.vehicle_number || "KA-08-E-1234",
        avatar_url: data.avatar_url || "/images/riders/rider_avatar.png",
        is_online: data.is_online !== undefined ? data.is_online : true,
        is_busy: false,
        total_trips: 0,
        rating: 5.0,
      });

      if (error) throw error;
      await get().fetchInitialData();
      return true;
    } catch (err: any) {
      console.error("Failed to create rider:", err);
      return false;
    }
  },

  updateRider: async (riderId: string, updates: Partial<AdminRider>) => {
    try {
      const { error } = await supabase.from("rider_profiles").update(updates).eq("id", riderId);
      if (error) throw error;

      set((state) => ({
        riders: state.riders.map((r) => (r.id === riderId ? { ...r, ...updates } : r)),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to update rider:", err);
      return false;
    }
  },

  toggleRiderOnline: async (riderId: string, isOnline: boolean) => {
    return get().updateRider(riderId, { is_online: isOnline });
  },

  resetRiderBusy: async (riderId: string) => {
    return get().updateRider(riderId, { is_busy: false, current_order_id: null });
  },

  deleteRider: async (riderId: string) => {
    try {
      const { error } = await supabase.from("rider_profiles").delete().eq("id", riderId);
      if (error) throw error;

      set((state) => ({
        riders: state.riders.filter((r) => r.id !== riderId),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to delete rider:", err);
      return false;
    }
  },

  // ---------------- PRODUCT ACTIONS ----------------
  createProduct: async (data: Partial<AdminProduct>) => {
    try {
      const id = data.id || `prod_${Date.now()}`;
      // In Supabase, prices are stored in paise (e.g. ₹50 -> 5000 paise)
      const priceInPaise = data.price
        ? data.price > 500
          ? Math.round(data.price)
          : Math.round(data.price * 100)
        : 5000;
      const inStock = data.in_stock !== undefined ? data.in_stock : true;

      const { error } = await supabase.from("products").insert({
        id,
        store_id: data.store_id,
        name: data.name,
        price: priceInPaise,
        category: data.category || "General",
        sub_category: data.sub_category || data.category || "General",
        description: data.description || "",
        image_url: data.image_url || "/images/products/surf_excel.png",
        in_stock: inStock,
        stock_count: data.stock_count || 50,
        availability: inStock ? "AVAILABLE" : "OUT OF STOCK",
        delivery_eta_minutes: data.delivery_eta_minutes || 10,
        is_active: true,
      });

      if (error) throw error;
      await get().fetchInitialData();
      return true;
    } catch (err: any) {
      console.error("Failed to create product:", err);
      return false;
    }
  },

  updateProduct: async (productId: string, updates: Partial<AdminProduct>) => {
    try {
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      // Convert rupee input to paise if updating price
      if (updates.price !== undefined) {
        payload.price = updates.price > 500 ? Math.round(updates.price) : Math.round(updates.price * 100);
      }
      if (updates.in_stock !== undefined) {
        payload.availability = updates.in_stock ? "AVAILABLE" : "OUT OF STOCK";
      }

      const { error } = await supabase.from("products").update(payload).eq("id", productId);
      if (error) throw error;

      set((state) => ({
        products: state.products.map((p) => (p.id === productId ? { ...p, ...payload } : p)),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to update product:", err);
      return false;
    }
  },

  toggleProductStock: async (productId: string, inStock: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          in_stock: inStock,
          availability: inStock ? "AVAILABLE" : "OUT OF STOCK",
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);
      if (error) throw error;

      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId
            ? { ...p, in_stock: inStock, availability: inStock ? "AVAILABLE" : "OUT OF STOCK" }
            : p
        ),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to toggle product stock:", err);
      return false;
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;

      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      return false;
    }
  },

  // ---------------- CUSTOMER ACTIONS ----------------
  updateCustomerVerification: async (customerId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ delivery_verified: verified })
        .eq("id", customerId);

      if (error) throw error;

      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === customerId ? { ...c, delivery_verified: verified } : c
        ),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to update customer:", err);
      return false;
    }
  },
}));
