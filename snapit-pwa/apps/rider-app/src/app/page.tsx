'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { IncomingOrderModal } from '@/components/dashboard/IncomingOrderModal';
import { useRider } from '@/context/RiderContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Check, Hourglass, ChevronDown, MapPin, Flame, TrendingUp, BarChart2, Clock, Star, ChevronRight } from 'lucide-react';

// ─── Tiny sparkline SVG components ─────────────────────────────────
const EarningsTrend = () => (
  <svg width="56" height="24" viewBox="0 0 56 24" fill="none">
    <polyline points="0,20 10,16 20,10 30,14 40,6 50,2 56,4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const DeliveriesChart = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
    {[8, 14, 10, 20, 16, 22].map((h, i) => (
      <rect key={i} x={i * 7} y={24 - h} width="5" height={h} rx="2" fill="#2563eb" opacity={i === 5 ? 1 : 0.4} />
    ))}
  </svg>
);
const OnlineTimeLine = () => (
  <svg width="56" height="24" viewBox="0 0 56 24" fill="none">
    <polyline points="0,14 8,10 16,16 24,8 32,14 40,6 48,12 56,8" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5 mt-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= Math.floor(rating) ? '#f59e0b' : '#e5e7eb'}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

// ─── Map Component (inline, light-themed with heat zones) ─────────
const DashboardMap: React.FC<{ isOnline: boolean; activeOrder: boolean; zoneName: string }> = ({
  isOnline,
  activeOrder,
  zoneName,
}) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: expanded ? 280 : 200 }}>
      {/* Map background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBgtdbyFa1-Md0dje5eC0PGii_kvQZXy3o-YKjm93DNqIpa_oEFEYWjpWIjQnk8dRhZKvuUouY2Lnc34P-ZR0nhLbvNECl_aC6Jytk_tziH1Z6zwK4qRbk0aNXxql50yMmFjGEsS8Vd_HiG4Df_ILUgQluS6nX9OA4A58UIWOZHcxYsxs5-mmBNw-Rv-0onSBFBDjFUjaOlcBBUcv6JrJpOyrwiKD5G868NGPi6o8YABlk3v17WdSFUEg')`,
        }}
      />

      {/* SVG heatmap + rider overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="heatRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.45)" />
            <stop offset="70%" stopColor="rgba(239,68,68,0.12)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0)" />
          </radialGradient>
          <radialGradient id="heatOrange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(249,115,22,0.40)" />
            <stop offset="70%" stopColor="rgba(249,115,22,0.10)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
          <radialGradient id="heatGreen" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34,197,94,0.35)" />
            <stop offset="70%" stopColor="rgba(34,197,94,0.08)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0)" />
          </radialGradient>
        </defs>

        {showHeatmap && (
          <g>
            <circle cx="200" cy="90" r="70" fill="url(#heatRed)" />
            <circle cx="300" cy="60" r="55" fill="url(#heatOrange)" />
            <circle cx="100" cy="130" r="50" fill="url(#heatOrange)" />
            <circle cx="320" cy="150" r="40" fill="url(#heatGreen)" />
          </g>
        )}

        {/* Green delivery zone markers */}
        {[
          { cx: 160, cy: 100 },
          { cx: 290, cy: 80 },
          { cx: 110, cy: 140 },
        ].map((pt, i) => (
          <g key={i}>
            <circle cx={pt.cx} cy={pt.cy} r="12" fill="white" stroke="#16a34a" strokeWidth="2" />
            <circle cx={pt.cx} cy={pt.cy} r="6" fill="#16a34a" />
          </g>
        ))}

        {/* Rider blue dot */}
        <circle cx="200" cy="120" r="20" fill="rgba(37,99,235,0.15)" />
        <circle cx="200" cy="120" r="10" fill="#2563eb" stroke="white" strokeWidth="2.5" />
      </svg>

      {/* High Demand pill on map */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-orange-500 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
          <Flame className="w-3 h-3" />
          High Demand · 4 orders
        </div>
      </div>

      {/* Right-side map controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
        <button
          className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 active:scale-95"
          title="Recenter"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => setShowHeatmap((h) => !h)}
          className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center border border-slate-200 active:scale-95 ${showHeatmap ? 'bg-primary/10' : 'bg-white'}`}
          title="Toggle layers"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showHeatmap ? '#16a34a' : '#374151'} strokeWidth="2" strokeLinecap="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 active:scale-95"
          title="Expand map"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
            {expanded
              ? <><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="10" y1="14" x2="21" y2="3" /><line x1="3" y1="21" x2="14" y2="10" /></>
              : <><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>
            }
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── Main Home Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    isOnline,
    activeOrder,
    incomingOrder,
    triggerMockOrder,
    rider,
    simulateApproval,
    earnings,
  } = useRider();
  const router = useRouter();

  // Greeting by time of day
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Online timer
  const [onlineSeconds, setOnlineSeconds] = useState(0);
  useEffect(() => {
    if (!isOnline) { setOnlineSeconds(0); return; }
    const t = setInterval(() => setOnlineSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isOnline]);
  const onlineHours = Math.floor(onlineSeconds / 3600);
  const onlineMins = Math.floor((onlineSeconds % 3600) / 60);
  const onlineTimeStr = onlineSeconds > 0
    ? `${onlineHours}h ${onlineMins.toString().padStart(2, '0')}m`
    : '5h 24m'; // fallback display

  // ── Verification gate ──────────────────────────────────────────
  if (!rider.isVerified) {
    return (
      <AppShell showHeader={false} showNav={false} noPadding={true}>
        <div className="min-h-screen bg-background flex flex-col justify-between p-6 max-w-sm mx-auto animate-fade-in">
          <div className="flex flex-col items-center text-center mt-8">
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full radar-ring" />
              <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-soft border border-slate-200">
                <Hourglass className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-4 py-1 rounded-full text-xs font-bold border border-amber-200 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Status: Verification In Progress</span>
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">Awaiting Admin Approval</h1>
            <p className="text-xs text-secondary mt-2 leading-relaxed max-w-[280px]">
              Hi <strong>{rider.name}</strong>, your KYC documents are under manual review.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 my-4">
            <h3 className="font-bold text-xs text-on-surface mb-3.5 flex justify-between">
              <span>Verification Checklist</span>
              <span className="text-primary font-mono text-[11px] font-bold">Step 3 of 4</span>
            </h3>
            <div className="space-y-3 text-xs">
              {['Live Selfie Captured & Matched', 'Aadhaar & PAN Scans Validated'].map((label) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><Check className="w-3 h-3" /></div>
                  <span className="font-semibold text-on-surface">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-container text-white flex items-center justify-center animate-pulse"><Check className="w-3 h-3" /></div>
                <span className="font-bold text-primary">Driving License Authenticity</span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">4</div>
                <span className="text-secondary">Admin Onboarding Approval</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pb-4">
            <button
              onClick={() => simulateApproval()}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-2xl shadow-lift flex items-center justify-center gap-2 active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              Simulate Admin Approval & Unlock Dashboard
            </button>
            <Link href="/onboarding" className="block text-center text-xs font-bold text-secondary hover:text-primary transition-colors py-1">
              Re-edit Application Form →
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Approved Rider Dashboard ───────────────────────────────────
  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-6">

        {/* ── Greeting + Zone selector ─────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[18px] font-black text-slate-900 leading-tight">
              {getGreeting()}, {rider.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isOnline ? "You're online and ready to receive orders." : "You're offline. Go online to start receiving orders."}
            </p>
          </div>

          {/* Zone pill */}
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-semibold text-slate-700 shrink-0 active:scale-95">
            <MapPin className="w-3.5 h-3.5 text-green-600" />
            <div className="text-left">
              <p className="text-[9px] text-slate-400 leading-none">Your Zone</p>
              <p className="text-[11px] font-bold text-slate-800">{rider.selectedZone || 'Downtown Central'}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* ── Live Demand Map ───────────────────────────────── */}
        <DashboardMap
          isOnline={isOnline}
          activeOrder={!!activeOrder}
          zoneName={rider.selectedZone || 'Downtown Central'}
        />

        {/* ── High Demand Strip ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-slate-900">
                High demand nearby <Flame className="inline w-4 h-4 text-orange-500" />
              </p>
              <p className="text-[11px] text-slate-500">
                12 orders near you in <span className="font-semibold text-green-700">{rider.selectedZone || 'Downtown Central'}</span>
              </p>
            </div>
          </div>
          <Link
            href="/orders"
            className="text-[11px] font-bold text-green-700 border border-green-200 bg-green-50 px-3 py-1.5 rounded-xl flex items-center gap-0.5 shrink-0 hover:bg-green-100 transition-colors"
          >
            View Zones <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Incoming Order Modal (if any) ─────────────────── */}
        {incomingOrder && !activeOrder && <IncomingOrderModal />}

        {/* ── Today's Overview 2×2 grid ────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[14px] font-bold text-slate-900">Today&apos;s Overview</h2>
            <Link href="/earnings" className="text-[11px] font-bold text-green-700 flex items-center gap-0.5">
              View Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Earnings */}
            <Link href="/earnings" className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between gap-2 active:scale-98 transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-700" />
                </div>
                <EarningsTrend />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Today&apos;s Earnings</p>
                <p className="text-[20px] font-black text-slate-900 font-mono leading-tight">₹{earnings.today.toLocaleString()}</p>
              </div>
            </Link>

            {/* Deliveries */}
            <Link href="/orders" className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between gap-2 active:scale-98 transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                </div>
                <DeliveriesChart />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Deliveries</p>
                <p className="text-[20px] font-black text-slate-900 font-mono leading-tight">{earnings.todayDeliveries}</p>
              </div>
            </Link>

            {/* Online Time */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <OnlineTimeLine />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Online Time</p>
                <p className="text-[20px] font-black text-slate-900 font-mono leading-tight">{onlineTimeStr}</p>
              </div>
            </div>

            {/* Rating */}
            <Link href="/profile" className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between gap-2 active:scale-98 transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <StarRow rating={rider.rating} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Rating</p>
                <p className="text-[20px] font-black text-slate-900 font-mono leading-tight">{rider.rating}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Available Orders ──────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[14px] font-bold text-slate-900">Available Orders</h2>
            <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              3 available
            </span>
          </div>

          {/* Order preview card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-start gap-3">
              {/* Restaurant image placeholder */}
              <div className="w-14 h-14 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0 overflow-hidden">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 font-mono">Order #SN12345</p>
                    {/* Distance row */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="text-center">
                        <p className="text-[13px] font-black text-slate-900">1.2 km</p>
                        <p className="text-[9px] text-slate-400 font-medium">Pickup</p>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div className="text-center">
                        <p className="text-[13px] font-black text-slate-900">3.4 km</p>
                        <p className="text-[9px] text-slate-400 font-medium">Drop</p>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div className="text-center">
                        <p className="text-[13px] font-black text-slate-900">5 Items</p>
                        <p className="text-[9px] text-slate-400 font-medium">Total</p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="text-right shrink-0">
                    <p className="text-[18px] font-black text-green-600 font-mono leading-none">₹85</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Estimated</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup address strip */}
            <div className="px-4 pb-3 flex items-center gap-1.5 text-[11px] text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span className="truncate">Pickup from Spice Route Restaurant, Indiranagar</span>
              <span className="ml-auto text-[10px] text-slate-400 shrink-0">12 min ago</span>
            </div>
          </div>
        </div>

        {/* ── Simulate order button (dev helper) ───────────── */}
        {!incomingOrder && !activeOrder && isOnline && (
          <button
            onClick={triggerMockOrder}
            className="text-[11px] font-bold text-primary flex items-center gap-1 bg-white/80 hover:bg-white px-3 py-1.5 rounded-full border border-primary/20 shadow-sm transition-all active:scale-95 self-start"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Simulate New Delivery Request
          </button>
        )}

        {/* ── View All Orders CTA ───────────────────────────── */}
        <Link
          href="/orders"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors active:scale-98"
        >
          View All Orders
          <ChevronRight className="w-4 h-4" />
        </Link>

      </div>
    </AppShell>
  );
}
