import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { FloatingRiderBubble } from '../orders/FloatingRiderBubble';
import { LiveOrderTrackerModal } from '../orders/LiveOrderTrackerModal';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';

export const AppLayout: React.FC = () => {
  const { userProfile } = useAuthStore();
  const { initLiveSubscription } = useOrderStore();
  const location = useLocation();

  useEffect(() => {
    const phone = userProfile?.phone || '8217649688';
    const cleanup = initLiveSubscription(phone);
    return () => {
      cleanup();
    };
  }, [userProfile?.phone, initLiveSubscription]);

  // Always scroll window and containers to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.querySelectorAll('.overflow-y-auto, main').forEach((el) => {
        el.scrollTop = 0;
      });
    }, 10);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Hide floating bubble only on cart page if needed
  const isCart = location.pathname === '/cart';

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-slate-50 shadow-2xl overflow-x-hidden flex flex-col pb-[140px]">
      <TopBar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      
      {/* Floating Live Order Rider Bubble on Home & Browsing views */}
      {!isCart && <FloatingRiderBubble />}

      {/* Unique Roadmap Delivery Track Modal Sheet */}
      <LiveOrderTrackerModal />

      <BottomNav />
    </div>
  );
};


