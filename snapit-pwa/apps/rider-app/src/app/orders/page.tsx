'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { RouteTimeline } from '@/components/orders/RouteTimeline';
import { SlideToConfirm } from '@/components/orders/SlideToConfirm';
import { LiveRouteSimulation } from '@/components/orders/LiveRouteSimulation';
import { Phone, Navigation, Check, Package, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const { activeOrder, ordersHistory, advanceActiveOrderStatus, triggerMockOrder } = useRider();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [showNavSimulation, setShowNavSimulation] = useState(false);
  const router = useRouter();

  const handleSlideArrive = () => {
    if (!activeOrder) return;
    if (activeOrder.status === 'picking_up' || activeOrder.status === 'accepted') {
      advanceActiveOrderStatus();
    } else {
      // Arrived at dropoff -> navigate to OTP confirmation
      router.push('/confirm-delivery');
    }
  };

  const getStatusStage = () => {
    if (!activeOrder) return 0;
    if (activeOrder.status === 'accepted') return 1;
    if (activeOrder.status === 'picking_up') return 2;
    if (activeOrder.status === 'arrived_at_pickup' || activeOrder.status === 'in_transit') return 2;
    if (activeOrder.status === 'arrived_at_dropoff') return 3;
    if (activeOrder.status === 'delivered') return 4;
    return 1;
  };

  return (
    <AppShell title="My Orders" subtitle="Manage active & past trips">
      <div className="flex flex-col gap-5 pt-2 pb-6">
        
        {/* Segmented Control Filter Tabs matching Stitch */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full border border-slate-300/60 shadow-inner">
          <button
            onClick={() => setSelectedTab('active')}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 ${
              selectedTab === 'active'
                ? 'bg-white text-primary shadow-soft scale-[1.02]'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Active {activeOrder ? '(1)' : ''}
          </button>

          <button
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 ${
              selectedTab === 'completed'
                ? 'bg-white text-primary shadow-soft scale-[1.02]'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Completed ({ordersHistory.length})
          </button>

          <button
            onClick={() => setSelectedTab('cancelled')}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all duration-200 ${
              selectedTab === 'cancelled'
                ? 'bg-white text-primary shadow-soft scale-[1.02]'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Cancelled (0)
          </button>
        </div>

        {/* TAB 1: ACTIVE ORDERS */}
        {selectedTab === 'active' && (
          <>
            {activeOrder ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Active Order Card */}
                <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-4 relative overflow-hidden">
                  {/* Decorative top green gradient */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary-container" />

                  {/* Header Row */}
                  <div className="flex justify-between items-start pt-1">
                    <div>
                      <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                        {activeOrder.status === 'picking_up'
                          ? 'Picking Up'
                          : activeOrder.status === 'in_transit'
                          ? 'On The Way'
                          : 'Arrived'}
                      </span>
                      <h3 className="font-bold text-base text-on-surface mt-1.5 font-mono">
                        Order #{activeOrder.orderNumber}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-xl text-primary font-mono leading-none">
                        ₹{activeOrder.earnings}
                      </span>
                      <p className="text-[10px] text-secondary font-semibold uppercase mt-0.5">
                        Est. Earnings
                      </p>
                    </div>
                  </div>

                  {/* Map Graphic Preview with Route */}
                  <div className="w-full h-32 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200 shadow-inner group">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3QUDEFUOGFAOYzQErgBkhcsP-PWi5Vt7MLrlm0cTm8Mlqp4Y31xt5zbXWvoIUmvq8t7WSNNAY8BHv25v33Mancbcolv7PwKgAO4rvLcoAegUDUp2Ldzg46Szct9bPbhrc63bt-a-JOruogmV7VH63ORzNLuzmQSOAeqyldaZjCghhyhiD5ALgMm9xo_0GQgTRJ6Rg0py8NAXqTnrsjRnezD6N_Awn35mnB_ex4NRsKPwmmRJfk6yG8g"
                      alt="Delivery Route"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2.5 right-2.5 glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-bold text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        directions_car
                      </span>
                      <span>{activeOrder.distanceKm} km ({activeOrder.estimatedMinutes} mins)</span>
                    </div>
                  </div>

                  {/* Route Timeline */}
                  <RouteTimeline order={activeOrder} />

                  <hr className="border-slate-100" />

                  {/* Action Buttons: Navigate & Call */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowNavSimulation(true)}
                      className="flex-1 bg-gradient-to-r from-primary to-primary-container text-white py-3 rounded-2xl font-bold text-xs shadow-lift hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Navigation className="w-4 h-4 fill-current" />
                      <span>Start Navigation</span>
                    </button>

                    <a
                      href={`tel:${activeOrder.customerPhone}`}
                      className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-primary hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
                      title="Call Customer"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>

                  {/* Interactive Slide to Arrive / Deliver */}
                  <div className="mt-1">
                    <SlideToConfirm
                      label={
                        activeOrder.status === 'picking_up'
                          ? 'Slide to Arrive at Store'
                          : 'Slide to Confirm Delivery OTP'
                      }
                      successLabel={
                        activeOrder.status === 'picking_up' ? 'Arrived at Store!' : 'Proceed to OTP'
                      }
                      onConfirm={handleSlideArrive}
                    />
                  </div>
                </div>

                {/* Order Details Basket Card */}
                <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-on-surface">Order Items</h3>
                    <span className="text-[11px] font-semibold text-secondary">
                      {activeOrder.items.length} items
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="flex flex-col gap-2.5">
                    {activeOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 rounded-2xl bg-surface-container-low border border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white text-primary border border-primary/20 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono shadow-sm">
                            {item.quantity}x
                          </div>
                          <span className="text-xs font-semibold text-on-surface">{item.name}</span>
                        </div>
                        {item.price && (
                          <span className="text-xs font-mono font-bold text-secondary">
                            ₹{item.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-100" />

                  {/* Multi-step Status Tracker Bar */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      Live Delivery Timeline
                    </h4>
                    
                    <div className="flex items-center relative py-2">
                      {/* Step 1: Accepted */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-primary">Accepted</span>
                      </div>

                      {/* Connecting Line 1 */}
                      <div
                        className={`flex-1 h-1 transition-colors ${
                          getStatusStage() >= 2 ? 'bg-primary' : 'bg-slate-200'
                        }`}
                      />

                      {/* Step 2: Picking Up */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            getStatusStage() >= 2
                              ? 'bg-primary text-white shadow-glow'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            getStatusStage() >= 2 ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          Pickup
                        </span>
                      </div>

                      {/* Connecting Line 2 */}
                      <div
                        className={`flex-1 h-1 transition-colors ${
                          getStatusStage() >= 3 ? 'bg-primary' : 'bg-slate-200'
                        }`}
                      />

                      {/* Step 3: Delivered */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            getStatusStage() >= 4
                              ? 'bg-primary text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            getStatusStage() >= 4 ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          Delivered
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fast track to OTP button */}
                  <Link
                    href="/confirm-delivery"
                    className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold text-center transition-colors border border-primary/20 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Delivery OTP Verification →</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Empty Active State */
              <div className="bg-white rounded-3xl p-8 shadow-soft border border-slate-200 text-center flex flex-col items-center gap-4 py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">two_wheeler</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">No Active Deliveries</h3>
                  <p className="text-xs text-secondary max-w-[240px] mt-1">
                    You're online in Downtown Central. New orders will appear here automatically.
                  </p>
                </div>
                <button
                  onClick={triggerMockOrder}
                  className="bg-primary text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lift hover:bg-primary/90 transition-all active:scale-95"
                >
                  Generate Test Delivery Request
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 2: COMPLETED ORDERS */}
        {selectedTab === 'completed' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            {ordersHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5 transition-all hover:border-primary/30"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-on-surface">
                        #{item.orderNumber}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Delivered
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-secondary mt-1">{item.restaurantName}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-base text-primary font-mono">
                      +₹{item.earnings}
                    </span>
                    <p className="text-[10px] text-secondary">{item.timestamp}</p>
                  </div>
                </div>

                <div className="text-[11px] text-secondary flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>Customer: {item.customerName}</span>
                  <span className="font-mono">{item.distanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CANCELLED ORDERS */}
        {selectedTab === 'cancelled' && (
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-slate-200 text-center flex flex-col items-center gap-3 py-12 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-on-surface">No Cancelled Orders</h3>
            <p className="text-xs text-secondary">
              Great job! Your cancellation rate is 0% this week.
            </p>
          </div>
        )}

      </div>

      {/* Turn-by-Turn Navigation Simulator Modal */}
      {showNavSimulation && activeOrder && (
        <LiveRouteSimulation
          order={activeOrder}
          onClose={() => setShowNavSimulation(false)}
        />
      )}
    </AppShell>
  );
}
