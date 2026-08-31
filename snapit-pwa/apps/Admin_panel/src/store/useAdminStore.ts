import { create } from "zustand";
import { supabase } from "../lib/supabase";
import {
  AdminOrder,
  AdminStore,
  AdminRider,
  AdminProduct,
  AdminCustomerProfile,
  OrderStatus,
} from "../types/admin";

interface AdminState {
  orders: AdminOrder[];
  stores: AdminStore[];
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

  // Store Actions
  createStore: (data: Partial<AdminStore>) => Promise<boolean>;
  updateStore: (storeId: string, updates: Partial<AdminStore>) => Promise<boolean>;
  toggleStoreOnline: (storeId: string, isOnline: boolean) => Promise<boolean>;
  deleteStore: (storeId: string) => Promise<boolean>;

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

export const useAdminStore = create<AdminState>((set, get) => ({
  orders: [],
  stores: [],
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
        ridersRes,
        productsRes,
        customersRes,
      ] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("stores").select("*").order("name", { ascending: true }),
        supabase.from("rider_profiles").select("*").order("name", { ascending: true }),
        supabase.from("products").select("*").order("name", { ascending: true }).limit(200),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      set({
        orders: (ordersRes.data as AdminOrder[]) || [],
        stores: (storesRes.data as AdminStore[]) || [],
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
            if (eventType === "INSERT") {
              updated = [...updated, newRecord as AdminStore];
            } else if (eventType === "UPDATE") {
              updated = updated.map((s) => (s.id === newRecord.id ? (newRecord as AdminStore) : s));
            } else if (eventType === "DELETE") {
              updated = updated.filter((s) => s.id !== oldRecord.id);
            }
            return { stores: updated, lastSyncTime: new Date().toLocaleTimeString() };
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

      // Optimistic update
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

  // ---------------- STORE ACTIONS ----------------
  createStore: async (data: Partial<AdminStore>) => {
    try {
      const id = data.id || `store_${Date.now()}`;
      const { error } = await supabase.from("stores").insert({
        id,
        name: data.name,
        category: data.category || "grocery",
        logo_url: data.logo_url || "/images/stores/mhetha-stores/metha-stores.avif",
        rating: data.rating || 4.8,
        is_online: data.is_online !== undefined ? data.is_online : true,
        address: data.address || "KGF Main Road",
        phone: data.phone || "8217649688",
        upi_id: data.upi_id || "minnit@upi",
      });

      if (error) throw error;
      await get().fetchInitialData();
      return true;
    } catch (err: any) {
      console.error("Failed to create store:", err);
      return false;
    }
  },

  updateStore: async (storeId: string, updates: Partial<AdminStore>) => {
    try {
      const { error } = await supabase.from("stores").update(updates).eq("id", storeId);
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
    return get().updateStore(storeId, { is_online: isOnline });
  },

  deleteStore: async (storeId: string) => {
    try {
      const { error } = await supabase.from("stores").delete().eq("id", storeId);
      if (error) throw error;

      set((state) => ({
        stores: state.stores.filter((s) => s.id !== storeId),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to delete store:", err);
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
      const { error } = await supabase.from("products").insert({
        id,
        store_id: data.store_id,
        name: data.name,
        price: data.price || 50,
        category: data.category || "Grocery",
        sub_category: data.sub_category || "Daily Essentials",
        description: data.description || "",
        image_url: data.image_url || "/images/products/surf_excel.png",
        in_stock: data.in_stock !== undefined ? data.in_stock : true,
        stock_count: data.stock_count || 50,
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
      const { error } = await supabase.from("products").update(updates).eq("id", productId);
      if (error) throw error;

      set((state) => ({
        products: state.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
      }));

      return true;
    } catch (err: any) {
      console.error("Failed to update product:", err);
      return false;
    }
  },

  toggleProductStock: async (productId: string, inStock: boolean) => {
    return get().updateProduct(productId, { in_stock: inStock });
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
