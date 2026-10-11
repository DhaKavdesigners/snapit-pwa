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
import { TermsView } from './features/legal/TermsView';
import { PrivacyView } from './features/legal/PrivacyView';
import { RefundPolicyView } from './features/legal/RefundPolicyView';
import { ShippingPolicyView } from './features/legal/ShippingPolicyView';
import { ContactView } from './features/legal/ContactView';
import { supabase } from './lib/supabase';
import { SessionGuard } from './components/auth/SessionGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 30000,
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
        <SessionGuard />
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

          {/* Public Legal & Policy Pages (Direct URLs for Razorpay Compliance Scanner & Visitors) */}
          <Route path="/terms" element={<TermsView />} />
          <Route path="/terms-and-conditions" element={<TermsView />} />
          <Route path="/privacy" element={<PrivacyView />} />
          <Route path="/privacy-policy" element={<PrivacyView />} />
          <Route path="/refund-policy" element={<RefundPolicyView />} />
          <Route path="/refunds" element={<RefundPolicyView />} />
          <Route path="/shipping-policy" element={<ShippingPolicyView />} />
          <Route path="/shipping" element={<ShippingPolicyView />} />
          <Route path="/delivery-policy" element={<ShippingPolicyView />} />
          <Route path="/contact" element={<ContactView />} />
          <Route path="/contact-us" element={<ContactView />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
