/**
 * main.tsx — SnapIt Rider App entry point
 *
 * Router layout:
 * /login         → LoginPage (public)
 * /dashboard     → DashboardPage (protected)
 * /order/:id     → OrderDetailPage (protected)
 * /kyc           → KycVaultPage (protected)
 * /profile       → ProfilePage (protected)
 * /              → Redirect to /dashboard or /login
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';

import './index.css';

import { useRiderStore } from './stores/riderStore';
import { BottomNav } from './components/BottomNav';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrderDetailPage from './pages/OrderDetailPage';
import KycVaultPage from './pages/KycVaultPage';
import ProfilePage from './pages/ProfilePage';

// ── TanStack Query client ────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// ── Auth Guard ───────────────────────────────────────────────────────────────

function ProtectedLayout() {
  const isAuthenticated = useRiderStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

// ── App Router ───────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — requires auth */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/order/:id"   element={<OrderDetailPage />} />
            <Route path="/order"       element={<OrderDetailPage />} />
            <Route path="/kyc"         element={<KycVaultPage />} />
            <Route path="/profile"     element={<ProfilePage />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

// ── Mount ────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
