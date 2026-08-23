import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { HomeView } from './features/home/HomeView';
import { ExploreView } from './features/explore/ExploreView';
import { FavoritesView } from './features/favorites/FavoritesView';
import { ProfileView } from './features/profile/ProfileView';
import { CartView } from './features/cart/CartView';
import { CheckoutView } from './features/checkout/CheckoutView';
import { OrderSuccessView } from './features/checkout/OrderSuccessView';
import { supabase } from './lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 0,
    },
  },
});

// ⚡ Global Supabase Realtime Listener Component for instant backend-to-UI sync (<100ms)
function GlobalRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('customer-app-realtime-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stores' },
        (payload) => {
          console.log('⚡ Realtime Store Update Received:', payload);
          qc.invalidateQueries({ queryKey: ['stores'] });
          qc.invalidateQueries({ queryKey: ['products'] });
          qc.invalidateQueries({ queryKey: ['trending'] });
          qc.invalidateQueries({ queryKey: ['todaysPicks'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('⚡ Realtime Product Update Received:', payload);
          qc.invalidateQueries({ queryKey: ['products'] });
          qc.invalidateQueries({ queryKey: ['trending'] });
          qc.invalidateQueries({ queryKey: ['todaysPicks'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('⚡ Realtime Order Update Received:', payload);
          qc.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe((status) => {
        console.log('⚡ Supabase Realtime Connection Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalRealtimeSync />
      <BrowserRouter>
        <Routes>
          {/* Main App Shell with Bottom Navigation */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeView />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/cart" element={<CartView />} />
            <Route path="/favorites" element={<FavoritesView />} />
            <Route path="/profile" element={<ProfileView />} />
          </Route>
          
          {/* Full Screen Flows without Bottom Navigation */}
          <Route path="/checkout" element={<CheckoutView />} />
          <Route path="/success" element={<OrderSuccessView />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
