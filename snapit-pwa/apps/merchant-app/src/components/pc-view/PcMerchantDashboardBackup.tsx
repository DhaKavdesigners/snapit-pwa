import React, { useState } from 'react';
import { Header } from '../common/Header';
import { OfflineBanner } from '../common/OfflineBanner';
import { AudioAlertBanner } from '../common/AudioAlertBanner';
import { DailyMetricsBar } from '../dashboard/DailyMetricsBar';
import { LiveOrdersQueue } from '../orders/LiveOrdersQueue';
import { LiveMenuManager } from '../menu/LiveMenuManager';
import { OrderHistory } from '../history/OrderHistory';
import { SettlementModal } from '../dashboard/SettlementModal';
import { PrepTimeModal } from '../orders/PrepTimeModal';
import { RejectModal } from '../orders/RejectModal';
import { AddEditProductModal } from '../menu/AddEditProductModal';
import { DeleteConfirmModal } from '../menu/DeleteConfirmModal';

/**
 * BACKUP OF PC / LAPTOP MULTI-COLUMN POS COUNTER INTERFACE
 * Kept safe and untouched for future desktop-specific enhancements.
 */
export const PcMerchantDashboardBackup: React.FC = () => {
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-canvas flex flex-col selection:bg-brand-100 selection:text-brand-700">
      <Header />
      <OfflineBanner />
      <AudioAlertBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DailyMetricsBar onOpenSettlement={() => setIsSettlementOpen(true)} />

        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-7 space-y-6">
            <LiveOrdersQueue />
          </div>
          <div className="col-span-5 space-y-6">
            <LiveMenuManager />
          </div>
        </div>

        <OrderHistory />
      </main>

      <PrepTimeModal />
      <RejectModal />
      <AddEditProductModal />
      <DeleteConfirmModal />
      <SettlementModal isOpen={isSettlementOpen} onClose={() => setIsSettlementOpen(false)} />
    </div>
  );
};

export default PcMerchantDashboardBackup;
