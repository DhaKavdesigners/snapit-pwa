import { useQuery } from '@tanstack/react-query';
import { Product, Store } from '../types';
import { mockShoppingProducts, mockShoppingStores, mockFoodProducts, mockFoodStores, mockTodaysPicks } from './mockData';
import { supabase } from '../lib/supabase';

// Helper: fetch live merged stores from Supabase
export async function fetchLiveStores(context?: 'shopping' | 'food'): Promise<Store[]> {
  try {
    const { data: dbStores, error } = await supabase
      .from('stores')
      .select('*');

    if (error || !dbStores || dbStores.length === 0) {
      if (context === 'shopping') return mockShoppingStores;
      if (context === 'food') return mockFoodStores;
      return [...mockShoppingStores, ...mockFoodStores];
    }

    const liveStores: Store[] = dbStores.map(db => {
      const isFood = (db.category || '').toUpperCase() === 'FOOD' || (db.category || '').toUpperCase() === 'RESTAURANT';
      return {
        id: db.id,
        name: db.name,
        logoUrl: db.logo_url || (isFood ? '/images/stores/venus ambur biriyani.jpg' : '/images/stores/mhetha-stores/metha-stores.avif'),
        fallbackLogoUrl: isFood
          ? 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
        rating: db.rating !== undefined && db.rating !== null ? Number(db.rating) : 4.8,
        category: isFood ? 'food' : 'grocery',
        isOpen: db.is_online !== undefined ? Boolean(db.is_online) : false,
      };
    });

    if (context === 'shopping') return liveStores.filter(s => s.category === 'grocery');
    if (context === 'food') return liveStores.filter(s => s.category === 'food');
    return liveStores;
  } catch (err) {
    console.warn("Using mock stores fallback:", err);
    if (context === 'shopping') return mockShoppingStores;
    if (context === 'food') return mockFoodStores;
    return [...mockShoppingStores, ...mockFoodStores];
  }
}

// Helper: fetch live products directly from Supabase (Strict 1:1 Database Sync)
export async function fetchLiveProducts(context?: 'shopping' | 'food', category?: string): Promise<Product[]> {
  try {
    const [storesResult, productsResult] = await Promise.all([
      fetchLiveStores(),
      supabase.from('products').select('*')
    ]);

    const storeMap = new Map(storesResult.map(s => [s.id, s]));
    const dbProducts = productsResult.data || [];

    // If database returned products, display ONLY what is in the Supabase products table
    if (dbProducts && dbProducts.length > 0) {
      const mappedDbProducts: Product[] = [];

      for (const db of dbProducts) {
        const s = storeMap.get(db.store_id) || (db.store_id === 's1' ? storeMap.get('g1') : db.store_id === 's4' ? storeMap.get('d1') : db.store_id === 'f3' ? storeMap.get('f1') : undefined);
        const isFood = (s?.category === 'food') || (db.category || '').toUpperCase().includes('FOOD') || (db.category || '').toUpperCase().includes('BIRYANI') || (db.category || '').toUpperCase().includes('STARTER') || (db.category || '').toUpperCase().includes('GRAV');
        const isStoreOpen = s !== undefined ? Boolean(s.isOpen) : false;
        const stockCount = db.stock_count !== undefined && db.stock_count !== null ? Number(db.stock_count) : 99;
        const isAvailableInStock = db.in_stock !== false && db.availability !== 'OUT OF STOCK' && stockCount > 0;
        const storeName = s?.name || (db.store_id === 'g1' || db.store_id === 's1' ? 'Mhetha Stores' : db.store_id === 'd1' || db.store_id === 's4' ? 'Nandhini KGF' : db.store_id === 'f1' || db.store_id === 'f3' ? 'Ambur Biriyani KGF' : 'Local Store');

        mappedDbProducts.push({
          id: db.id,
          name: db.name || 'Product',
          price: Number(db.price) || 0,
          imageUrl: db.image_url || '/images/products/placeholder.jpg',
          fallbackImageUrl: db.image_url || undefined,
          storeId: db.store_id,
          category: isFood ? 'food' : 'grocery',
          subCategory: db.category || (isFood ? 'Biryani Specials' : 'Cooking Essentials'),
          deliveryEtaMinutes: db.delivery_eta_minutes || 10,
          inStock: isAvailableInStock,
          stockCount: stockCount,
          description: db.description || '',
          storeName: storeName,
          storeIsOpen: isStoreOpen,
        });
      }

      const filteredByContext = mappedDbProducts.filter(p => {
        if (!context) return true;
        if (context === 'shopping') return p.category === 'grocery';
        if (context === 'food') return p.category === 'food' || p.category === 'bakery';
        return p.category === context;
      });

      if (category) {
        return filteredByContext.filter(p => p.category === category || p.subCategory === category);
      }
      return filteredByContext;
    }

    // Fallback only if database is completely empty or offline
    const base = context === 'shopping' ? mockShoppingProducts : context === 'food' ? mockFoodProducts : [...mockShoppingProducts, ...mockFoodProducts];
    if (category) return base.filter(p => p.category === category || p.subCategory === category);
    return base;
  } catch (err) {
    console.warn("Using mock products fallback:", err);
    const base = context === 'shopping' ? mockShoppingProducts : context === 'food' ? mockFoodProducts : [...mockShoppingProducts, ...mockFoodProducts];
    if (category) return base.filter(p => p.category === category || p.subCategory === category);
    return base;
  }
}

export const useStores = (context: 'shopping' | 'food') => {
  return useQuery({
    queryKey: ['stores', context],
    queryFn: () => fetchLiveStores(context),
    staleTime: 0,
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
  });
};

export const useAllStores = () => {
  return useQuery({
    queryKey: ['stores', 'all'],
    queryFn: () => fetchLiveStores(),
    staleTime: 0,
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
  });
};

export const useProducts = (context: 'shopping' | 'food', category?: string) => {
  return useQuery({
    queryKey: ['products', context, category],
    queryFn: () => fetchLiveProducts(context, category),
    staleTime: 0,
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
  });
};

export const useAllProducts = () => {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => fetchLiveProducts(),
    staleTime: 0,
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
  });
};

export const useTrending = (context: 'shopping' | 'food') => {
  return useQuery({
    queryKey: ['trending', context],
    queryFn: async (): Promise<Product[]> => {
      const all = await fetchLiveProducts(context);
      return all.slice(0, 6);
    },
    staleTime: 0,
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
  });
};

export const useTodaysPicks = () => {
  return useQuery({
    queryKey: ['todaysPicks'],
    queryFn: async (): Promise<Product[]> => {
      const liveShopping = await fetchLiveProducts('shopping');
      return liveShopping.filter(p => p.inStock && p.storeIsOpen !== false).slice(0, 5);
    },
    staleTime: 0,
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
  });
};

