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

    const dbStoreMap = new Map(dbStores.map(s => [s.id, s]));

    const mapStore = (mock: Store): Store => {
      const db = dbStoreMap.get(mock.id);
      if (!db) return mock;
      return {
        ...mock,
        name: db.name || mock.name,
        isOpen: db.is_online !== undefined ? Boolean(db.is_online) : mock.isOpen,
        rating: db.rating !== undefined && db.rating !== null ? Number(db.rating) : mock.rating,
        logoUrl: db.logo_url ? db.logo_url : mock.logoUrl,
        category: db.category?.toUpperCase() === 'FOOD' ? 'food' : 'grocery',
      };
    };

    const mergedShopping = mockShoppingStores.map(mapStore);
    const mergedFood = mockFoodStores.map(mapStore);

    // Include any new stores in DB not present in mock data
    const existingIds = new Set([...mergedShopping.map(s => s.id), ...mergedFood.map(s => s.id)]);
    for (const db of dbStores) {
      if (!existingIds.has(db.id)) {
        const isFood = db.category?.toUpperCase() === 'FOOD';
        const newStore: Store = {
          id: db.id,
          name: db.name,
          logoUrl: db.logo_url || (isFood ? '/images/stores/bakio/bakio_kgf.jpg' : '/images/stores/mhetha-stores/metha-stores.avif'),
          fallbackLogoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
          rating: db.rating ? Number(db.rating) : 4.8,
          category: isFood ? 'food' : 'grocery',
          isOpen: db.is_online !== undefined ? Boolean(db.is_online) : true,
        };
        if (isFood) mergedFood.push(newStore);
        else mergedShopping.push(newStore);
      }
    }

    if (context === 'shopping') return mergedShopping;
    if (context === 'food') return mergedFood;
    return [...mergedShopping, ...mergedFood];
  } catch (err) {
    console.warn("Using mock stores fallback:", err);
    if (context === 'shopping') return mockShoppingStores;
    if (context === 'food') return mockFoodStores;
    return [...mockShoppingStores, ...mockFoodStores];
  }
}

// Helper: fetch live merged products from Supabase
export async function fetchLiveProducts(context?: 'shopping' | 'food', category?: string): Promise<Product[]> {
  try {
    const [storesResult, productsResult] = await Promise.all([
      fetchLiveStores(),
      supabase.from('products').select('*')
    ]);

    const storeMap = new Map(storesResult.map(s => [s.id, s.name]));
    const dbProducts = productsResult.data || [];

    // 1. Map all real database products
    const dbStoreIdsWithProducts = new Set<string>();
    const mappedDbProducts: Product[] = [];

    for (const p of dbProducts) {
      dbStoreIdsWithProducts.add(p.store_id);
      const isFood = p.category?.toUpperCase().includes('FOOD') || p.category?.toUpperCase().includes('BIRYANI');
      mappedDbProducts.push({
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        imageUrl: p.image_url || '/images/products/placeholder.jpg',
        fallbackImageUrl: p.image_url || undefined,
        storeId: p.store_id,
        category: isFood ? 'food' : 'grocery',
        subCategory: p.category,
        deliveryEtaMinutes: p.delivery_eta_minutes || 10,
        inStock: p.in_stock !== false && p.availability !== 'OUT OF STOCK',
        description: p.description,
        storeName: storeMap.get(p.store_id) || (p.store_id === 's1' ? 'Mhetha Stores' : p.store_id === 's4' ? 'Nandhini KGF' : 'Local Store')
      });
    }

    const baseProducts = context === 'shopping' 
      ? mockShoppingProducts 
      : context === 'food' 
        ? mockFoodProducts 
        : [...mockShoppingProducts, ...mockFoodProducts];

    // 2. Remove dummy products for any store that has real database products
    const filteredDummyProducts = baseProducts
      .filter(mock => !dbStoreIdsWithProducts.has(mock.storeId))
      .map(mock => ({
        ...mock,
        storeName: storeMap.get(mock.storeId) || mock.storeName
      }));

    // 3. Filter DB products by context if requested
    const filteredDbProducts = mappedDbProducts.filter(live => !context || live.category === context);

    // 4. Combine: Real products first, then dummy items for unseeded stores
    const mergedList = [...filteredDbProducts, ...filteredDummyProducts];

    if (category) {
      return mergedList.filter(p => p.category === category || p.subCategory === category);
    }
    return mergedList;
  } catch (err) {
    console.warn("Using mock products fallback:", err);
    const base = context === 'shopping' ? mockShoppingProducts : context === 'food' ? mockFoodProducts : [...mockShoppingProducts, ...mockFoodProducts];
    if (category) return base.filter(p => p.category === category);
    return base;
  }
}

export const useStores = (context: 'shopping' | 'food') => {
  return useQuery({
    queryKey: ['stores', context],
    queryFn: () => fetchLiveStores(context),
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useAllStores = () => {
  return useQuery({
    queryKey: ['stores', 'all'],
    queryFn: () => fetchLiveStores(),
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useProducts = (context: 'shopping' | 'food', category?: string) => {
  return useQuery({
    queryKey: ['products', context, category],
    queryFn: () => fetchLiveProducts(context, category),
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useAllProducts = () => {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => fetchLiveProducts(),
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useTrending = (context: 'shopping' | 'food') => {
  return useQuery({
    queryKey: ['trending', context],
    queryFn: async (): Promise<Product[]> => {
      const all = await fetchLiveProducts(context);
      return all.slice(0, 6);
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useTodaysPicks = () => {
  return useQuery({
    queryKey: ['todaysPicks'],
    queryFn: async (): Promise<Product[]> => {
      const liveShopping = await fetchLiveProducts('shopping');
      return liveShopping.filter(p => p.inStock).slice(0, 5);
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

