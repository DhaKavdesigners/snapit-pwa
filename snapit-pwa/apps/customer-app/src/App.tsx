import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { HomeView } from './features/home/HomeView';
import { ExploreView } from './features/explore/ExploreView';
import { FavoritesView } from './features/favorites/FavoritesView';
import { ProfileView } from './features/profile/ProfileView';
import { CartView } from './features/cart/CartView';
import { CheckoutView } from './features/checkout/CheckoutView';
import { OrderSuccessView } from './features/checkout/OrderSuccessView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
