import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { HomeView } from './features/home/HomeView';
import { ExploreView } from './features/explore/ExploreView';
import { FavoritesView } from './features/favorites/FavoritesView';
import { ProfileView } from './features/profile/ProfileView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const DummyView = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full pt-20">
    <h2 className="text-xl font-bold">{title}</h2>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeView />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/cart" element={<DummyView title="Cart - Coming Soon" />} />
            <Route path="/favorites" element={<FavoritesView />} />
            <Route path="/profile" element={<ProfileView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
