import React from 'react';
import { Header } from '../common/Header';
import { OfflineBanner } from '../common/OfflineBanner';
import { AudioAlertBanner } from '../common/AudioAlertBanner';
import { LowStockWarningBanner } from '../common/LowStockWarningBanner';
import { DailyMetricsBar } from '../dashboard/DailyMetricsBar';
import { LiveOrdersQueue } from '../orders/LiveOrdersQueue';
import { LiveMenuManager } from '../menu/LiveMenuManager';
import { OrderHistory } from '../history/OrderHistory';

interface PcMerchantDashboardProps {
  onOpenSettlement?: () => void;
}

/**
 * Full-width Laptop / Desktop POS Counter Interface (Screen Width >= 1024px)
 * Displays side-by-side Live Orders Queue, Live Menu Catalog, Realtime Metrics, and Transaction History.
 */
export const PcMerchantDashboard: React.FC<PcMerchantDashboardProps> = ({ onOpenSettlement }) => {
  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col selection:bg-brand-100 selection:text-brand-700">
      {/* Desktop Navigation Header */}
      <Header />

      {/* Context Banners */}
      <OfflineBanner />
      <AudioAlertBanner />
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <LowStockWarningBanner />
      </div>

      {/* Main Multi-Column POS Counter Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Metrics Summary */}
        <DailyMetricsBar onOpenSettlement={onOpenSettlement} />

        {/* 2-Column Split: Orders (Left 7 Cols) + Menu (Right 5 Cols) */}
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-7 space-y-6">
            <LiveOrdersQueue />
          </div>
          <div className="col-span-5 space-y-6">
            <LiveMenuManager />
          </div>
        </div>

        {/* Bottom Historical Orders & Transactions */}
        <OrderHistory />
      </main>
    </div>
  );
};

export default PcMerchantDashboard;
