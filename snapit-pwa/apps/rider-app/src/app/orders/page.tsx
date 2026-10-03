'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import {
  CheckCircle2,
  AlertCircle,
  Store,
  MapPin,
  Calendar,
  X,
  ChevronDown,
  RotateCcw,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { formatOrderNumber } from '@/utils/orderUtils';
import { OrderHistoryItem, DateFilterOption, OrderHistoryCategory } from '@/types';
import {
  fetchRiderOrderHistory,
  formatISTDateTime
} from '@/services/supabaseOrderService';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';

const DATE_FILTER_LABELS: Record<DateFilterOption | 'all', string> = {
  all: 'All Time',
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 Days',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  custom: 'Custom Range',
};

export default function OrdersPage() {
  const { rider } = useRider();
  const [selectedTab, setSelectedTab] = useState<OrderHistoryCategory>('completed');
  const [dateFilter, setDateFilter] = useState<DateFilterOption | 'all'>('all');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState<boolean>(false);
  
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderHistoryItem | null>(null);

  // Today's date string in Indian Standard Time (YYYY-MM-DD) to prevent future dates
  const todayIST = useMemo(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(Date.now() + IST_OFFSET_MS);
    const y = nowIst.getUTCFullYear();
    const m = String(nowIst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(nowIst.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Fetch orders from Supabase based on current authenticated rider, tab, and date filter
  const loadOrders = useCallback(async () => {
    const riderIdentifier = rider.phone || rider.name || rider.Rider_ID;
    if (!riderIdentifier) {
      setIsLoading(false);
      setOrders([]);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    const activeFilterOption: DateFilterOption | undefined = dateFilter === 'all' ? undefined : dateFilter;
    const activeRange = dateFilter === 'custom' ? (appliedCustomRange || undefined) : undefined;

    const result = await fetchRiderOrderHistory(riderIdentifier, {
      category: selectedTab,
      dateFilter: activeFilterOption,
      customRange: activeRange,
    });

    if (result.error) {
      setFetchError(result.error);
      setOrders([]);
    } else {
      setOrders(result.orders);
    }
    setIsLoading(false);
  }, [rider.phone, rider.name, rider.Rider_ID, selectedTab, dateFilter, appliedCustomRange]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle custom date apply with chronological order validation
  const handleApplyCustomDate = () => {
    if (!customFrom || !customTo) {
      return;
    }
    let fromDate = customFrom;
    let toDate = customTo;
    if (fromDate > toDate) {
      const temp = fromDate;
      fromDate = toDate;
      toDate = temp;
    }
    // Prevent future dates
    const finalTo = toDate > todayIST ? todayIST : toDate;
    setAppliedCustomRange({ from: fromDate, to: finalTo });
    setDateFilter('custom');
    setIsDateFilterModalOpen(false);
  };

  const handleClearDateFilter = () => {
    setDateFilter('all');
    setCustomFrom('');
    setCustomTo('');
    setAppliedCustomRange(null);
    setIsDateFilterModalOpen(false);
  };

  // Determine current active date filter button label
  const activeDateLabel = useMemo(() => {
    if (dateFilter === 'custom' && appliedCustomRange) {
      return `${appliedCustomRange.from} to ${appliedCustomRange.to}`;
    }
    return DATE_FILTER_LABELS[dateFilter] || 'Filter by Date';
  }, [dateFilter, appliedCustomRange]);

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pt-2 pb-12 max-w-md mx-auto w-full">

        {/* ── 1. HEADER (Title Case: Order History) ── */}
        <div className="px-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Order History</h1>
            <p className="text-xs text-slate-500 mt-0.5">Your official delivery assignments</p>
          </div>
          <button
            type="button"
            onClick={loadOrders}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Refresh Orders"
            aria-label="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* ── 2. TWO MAIN CATEGORIES ONLY: [ Completed ] [ Cancelled ] ── */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full border border-slate-300/60 shadow-inner">
          <button
            type="button"
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedTab === 'completed'
                ? 'bg-white text-emerald-800 shadow-sm scale-[1.01]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${selectedTab === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Completed</span>
            {selectedTab === 'completed' && !isLoading && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-100/80 text-emerald-800 text-[10px] rounded-full font-mono">
                {orders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('cancelled')}
            className={`flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedTab === 'cancelled'
                ? 'bg-white text-rose-800 shadow-sm scale-[1.01]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle className={`w-3.5 h-3.5 ${selectedTab === 'cancelled' ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Cancelled</span>
            {selectedTab === 'cancelled' && !isLoading && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-rose-100/80 text-rose-800 text-[10px] rounded-full font-mono">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* ── 3. DATE FILTER CONTROL (Search removed per specification) ── */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDateFilterModalOpen(true)}
            className={`flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              dateFilter !== 'all'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Calendar className={`w-3.5 h-3.5 shrink-0 ${dateFilter !== 'all' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="truncate">{activeDateLabel}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {dateFilter !== 'all' && (
            <button
              type="button"
              onClick={handleClearDateFilter}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Reset date filter"
              aria-label="Reset date filter"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* ── 4. CONTENT LISTING ── */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className="flex flex-col gap-3 animate-pulse pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-28" />
                    <div className="h-3 bg-slate-100 rounded-md w-40" />
                  </div>
                  <div className="h-5 bg-slate-200 rounded-md w-16" />
                </div>
                <div className="h-3 bg-slate-100 rounded-md w-3/4 pt-2 border-t border-slate-100" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          /* Network or Database Error State with Retry */
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-rose-200 text-center flex flex-col items-center gap-3 py-12">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-2xs">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">
                Unable to load orders
              </h3>
              <p className="text-xs text-slate-500 max-w-[260px] mt-1 leading-relaxed">
                {fetchError}
              </p>
            </div>
            <button
              type="button"
              onClick={loadOrders}
              className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : orders.length > 0 ? (
          /* Order Cards List */
          <div className="flex flex-col gap-3 animate-fade-in">
            {orders.map((order) => {
              const displayId = formatOrderNumber(order.orderNumber || order.id);
              const timeFormatted = formatISTDateTime(order.completedAt || order.cancelledAt || order.createdAt);
              const totalItems = order.items.reduce((sum, it) => sum + (it.quantity || 1), 0);

              if (selectedTab === 'completed') {
                /* ── COMPLETED ORDER CARD ── */
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderForModal(order)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                    {/* Top Row: Order ID + Status + Individual Earning */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            #{displayId}
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border border-emerald-200">
                            COMPLETED
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{order.restaurantName}</span>
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-400">You earned</span>
                        <p className="font-black text-base text-emerald-600 font-mono leading-tight">
                          ₹{order.earnings}
                        </p>
                      </div>
                    </div>

                    {/* Middle Info: Date/Time + Items + Distance */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{timeFormatted.fullStr || 'Time not recorded'}</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        {totalItems > 0 && <span>{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>}
                        {order.distanceKm > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono">{order.distanceKm} km</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Destination Delivery Area */}
                    <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">
                          Delivered to: {order.deliveryAddress || 'Customer Location'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 ml-2 shrink-0">
                        View details →
                      </span>
                    </div>
                  </div>
                );
              }

              /* ── CANCELLED ORDER CARD ── */
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderForModal(order)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  {/* Top Row: Order ID + Status */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          #{displayId}
                        </span>
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border border-rose-200">
                          CANCELLED
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{order.restaurantName}</span>
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 font-mono">{timeFormatted.dateStr}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{timeFormatted.timeStr}</p>
                    </div>
                  </div>

                  {/* Cancellation Reason & Source */}
                  <div className="bg-rose-50/60 rounded-xl p-2.5 border border-rose-100 text-xs">
                    <p className="font-semibold text-rose-900">
                      {order.cancellationReason || 'Delivery cancelled'}
                    </p>
                    {order.cancelledBy && (
                      <p className="text-[10px] text-rose-600 mt-0.5 capitalize">
                        Source: {order.cancelledBy}
                      </p>
                    )}
                  </div>

                  {/* Operational Status Badges (Pickup / Return) */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {order.pickupStatus === 'picked_up' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                          Picked up but not delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          Cancelled before pickup
                        </span>
                      )}

                      {order.pickupStatus === 'picked_up' && (
                        order.returnStatus === 'returned_to_shop' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <RotateCcw className="w-2.5 h-2.5" />
                            Returned to shop
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            <RotateCcw className="w-2.5 h-2.5" />
                            Return Pending
                          </span>
                        )
                      )}
                    </div>

                    {totalItems > 0 && (
                      <span className="text-slate-400 font-medium shrink-0 ml-1">
                        {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                      </span>
                    )}
                  </div>

                  {/* Destination Location Info */}
                  <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">
                        Area: {order.deliveryAddress || 'Customer Location'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 ml-2 shrink-0">
                      View details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── 5. EMPTY STATES ACCORDING TO RULES ── */
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-200/80 text-center flex flex-col items-center gap-3 py-14">
            {dateFilter !== 'all' ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shadow-2xs">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    No orders found for this date range.
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                    There are no deliveries matching {activeDateLabel}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="mt-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Date Filter
                </button>
              </>
            ) : selectedTab === 'completed' ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    No completed orders found.
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                    Your successfully completed deliveries will appear here.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shadow-2xs">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    No cancelled orders found.
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                    There are no cancelled deliveries to show.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* ── 6. DATE FILTER SELECTION MODAL / BOTTOM SHEET ── */}
      {isDateFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsDateFilterModalOpen(false)} />

          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-slide-up p-5 space-y-4">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto sm:hidden shrink-0" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Filter by Date (IST)
              </h3>
              <button
                type="button"
                onClick={() => setIsDateFilterModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
                aria-label="Close date filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2">
              {(['all', 'today', 'yesterday', 'last_7_days', 'this_week', 'last_week', 'this_month', 'last_month'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setDateFilter(opt);
                    setAppliedCustomRange(null);
                    setIsDateFilterModalOpen(false);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-left transition-colors cursor-pointer ${
                    dateFilter === opt && !appliedCustomRange
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {DATE_FILTER_LABELS[opt]}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-800">
                Custom Date Range
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    max={todayIST}
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    max={todayIST}
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  disabled={!customFrom || !customTo}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply Custom Range
                </button>
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── 7. ORDER DETAILS MODAL ── */}
      <OrderDetailsModal
        order={selectedOrderForModal}
        isOpen={Boolean(selectedOrderForModal)}
        onClose={() => setSelectedOrderForModal(null)}
      />

    </AppShell>
  );
}
