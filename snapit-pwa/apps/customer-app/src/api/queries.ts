import { useQuery } from '@tanstack/react-query';
import { Product, Store } from '../types';
import { mockShoppingProducts, mockShoppingStores, mockFoodProducts, mockFoodStores, mockTodaysPicks } from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useStores = (context: 'shopping' | 'food') => {
  return useQuery({
    queryKey: ['stores', context],
    queryFn: async (): Promise<Store[]> => {
      await delay(800); // Simulate network delay
      return context === 'shopping' ? mockShoppingStores : mockFoodStores;
    },
  });
};

export const useProducts = (context: 'shopping' | 'food', category?: string) => {
  return useQuery({
    queryKey: ['products', context, category],
    queryFn: async (): Promise<Product[]> => {
      await delay(1000); // Simulate network delay
      const allProducts = context === 'shopping' ? mockShoppingProducts : mockFoodProducts;
      if (category) {
        return allProducts.filter(p => p.category === category);
      }
      return allProducts;
    },
  });
};

export const useAllProducts = () => {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: async (): Promise<Product[]> => {
      await delay(800);
      return [...mockShoppingProducts, ...mockFoodProducts];
    },
  });
};

export const useTrending = (context: 'shopping' | 'food') => {
  return useQuery({
    queryKey: ['trending', context],
    queryFn: async (): Promise<Product[]> => {
      await delay(900);
      const allProducts = context === 'shopping' ? mockShoppingProducts : mockFoodProducts;
      return allProducts.slice(0, 5);
    },
  });
};





export const useTodaysPicks = () => {
  return useQuery({
    queryKey: ['todaysPicks'],
    queryFn: async (): Promise<Product[]> => {
      await delay(850);
      return mockTodaysPicks;
    },
  });
};
