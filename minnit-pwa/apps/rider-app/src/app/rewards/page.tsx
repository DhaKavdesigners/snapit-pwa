'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { triggerHaptic } from '@/services/preferenceService';
import {
  Gift,
  Lock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Award,
  Sun,
  Flame,
  X,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Clock,
  PartyPopper,
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface VoucherItem {
  id: string;
  code: string;
  title: string;
  category: string;
  value: string;
  description: string;
  claimedAt: string;
  expiresAt: string;
}

interface MilestoneBox {
  id: string;
  title: string;
  subtitle: string;
  targetOrders: number;
  highlight?: boolean;
  accentFrom: string;
  accentTo: string;
  tagLabel: string;
  rewards: {
    cashOption: { amount: number; label: string; desc: string };
    productOption: { title: string; value: string; desc: string; code: string };
  };
}

/* ─── Milestone Data (20 & 30 Orders) ────────────────────────────────────── */
const MILESTONES: MilestoneBox[] = [
  {
    id: 'box_20',
    title: 'Rising Rider Box',
    subtitle: 'Earn ₹250 cash or a hydration care kit',
    targetOrders: 20,
    accentFrom: 'from-emerald-500',
    accentTo: 'to-teal-500',
    tagLabel: '🎁 20 Deliveries',
    rewards: {
      cashOption: {
        amount: 250,
        label: '₹250 Cash Bonus',
        desc: 'Credited straight to your Minnit wallet',
      },
      productOption: {
        title: 'Hydration & Energy Kit',
        value: '₹250 Value',
        desc: 'Electrolyte pack for hot delivery shifts in KGF',
        code: 'MINNIT-HYDRATE-250',
      },
    },
  },
  {
    id: 'box_30',
    title: 'Pro Legend Mega Box',
    subtitle: 'Unlock ₹500 cash or SPF UV Sunscreen Kit',
    targetOrders: 30,
    highlight: true,
    accentFrom: 'from-emerald-700',
    accentTo: 'to-green-900',
    tagLabel: '⭐ 30 Deliveries Mega',
    rewards: {
      cashOption: {
        amount: 500,
        label: '₹500 Cash Bonus',
        desc: 'Direct cash credited to your Minnit rider wallet',
      },
      productOption: {
        title: 'Sunscreen & UV Skin Shield Kit',
        value: '₹500 Value',
        desc: 'Full SPF 50+ UV protection kit for KGF delivery riders',
        code: 'MINNIT-SUN-500',
      },
    },
  },
];


const TOTAL_TARGET = 30;

/* ─── Rewards Page ───────────────────────────────────────────────────────── */
export default function RewardsPage() {
  const { rider, earnings, alerts, markAlertAsRead, updateRiderProfile } = useRider();

  const [testBonus, setTestBonus] = useState(0);
  const completedToday = (earnings?.todayDeliveries ?? 0) + testBonus;

  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [openedBox, setOpenedBox] = useState<MilestoneBox | null>(null);
  const [modalState, setModalState] = useState<'preview' | 'choose' | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);

  /* Persist & hydrate */
  useEffect(() => {
    try {
      const k = rider.phone || rider.minnit_id || 'guest';
      const c = localStorage.getItem(`minnit_claims_${k}`);
      const v = localStorage.getItem(`minnit_vouchers_${k}`);
      if (c) setClaimedIds(JSON.parse(c));
      if (v) setVouchers(JSON.parse(v));
    } catch {}
  }, [rider.phone, rider.minnit_id]);

  const persistClaim = (boxId: string, vch?: VoucherItem) => {
    const k = rider.phone || rider.minnit_id || 'guest';
    const next = [...claimedIds, boxId];
    setClaimedIds(next);
    try {
      localStorage.setItem(`minnit_claims_${k}`, JSON.stringify(next));
      if (vch) {
        const nv = [vch, ...vouchers];
        setVouchers(nv);
        localStorage.setItem(`minnit_vouchers_${k}`, JSON.stringify(nv));
      }
    } catch {}
  };

  const boom = () => {
    try {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.65 }, colors: ['#10b981', '#f59e0b', '#6366f1', '#ec4899'] });
    } catch {}
  };

  /* Open box tap */
  const handleBoxTap = (box: MilestoneBox) => {
    triggerHaptic(12);
    setOpenedBox(box);
    const unlocked = completedToday >= box.targetOrders;
    const claimed = claimedIds.includes(box.id);
    setModalState(unlocked && !claimed ? 'choose' : 'preview');
    if (unlocked && !claimed) boom();
  };

  const handleClaimCash = (box: MilestoneBox) => {
    triggerHaptic([40, 40, 40]);
    updateRiderProfile({ walletBalance: (rider.walletBalance || 0) + box.rewards.cashOption.amount });
    boom();
    persistClaim(box.id);
    setOpenedBox(null);
    setModalState(null);
  };

  const handleClaimVoucher = (box: MilestoneBox) => {
    triggerHaptic([40, 40, 40]);
    const p = box.rewards.productOption;
    const vch: VoucherItem = {
      id: `vch_${Date.now()}`,
      code: p.code,
      title: p.title,
      category: 'Care Kit',
      value: p.value,
      description: p.desc,
      claimedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      expiresAt: '31 Oct 2026',
    };
    boom();
    persistClaim(box.id, vch);
    setOpenedBox(null);
    setModalState(null);
  };

  const handleCopyCode = (code: string) => {
    triggerHaptic(8);
    try { navigator.clipboard.writeText(code); } catch {}
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const progressPct = Math.min(100, Math.round((completedToday / TOTAL_TARGET) * 100));
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <AppShell>
      <div className="flex flex-col gap-5 pt-2 pb-20 max-w-md mx-auto w-full px-4">

        {/* ── PAGE TITLE ── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-[18px] font-black text-slate-900 leading-tight tracking-tight">
              Rider Rewards
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Complete deliveries to unlock mystery gifts
            </p>
          </div>
          {/* Test control — discreet */}
          <button
            type="button"
            onClick={() => setTestBonus((p) => (p >= TOTAL_TARGET ? 0 : p + 1))}
            className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded-full cursor-pointer transition-all"
            title="Simulate order completion"
          >
            +1 Test ({completedToday})
          </button>
        </div>

        {/* ── QUEST PROGRESS HERO CARD (CLEAN MINNIT THEME) ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-5 border-2 border-emerald-200/90 shadow-xs">
          {/* Subtle background ambient accents */}
          <div className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-emerald-200/30 blur-xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-teal-200/30 blur-xl" />

          <div className="relative z-10 space-y-3.5">
            {/* Label row */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-1 rounded-full shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Today&apos;s Quest
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Resets at midnight
              </span>
            </div>

            {/* Count */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 leading-none tracking-tight">{completedToday}</span>
              <span className="text-sm font-bold text-slate-500">/ {TOTAL_TARGET} orders</span>
              <span className="ml-auto text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">{progressPct}% Completed</span>
            </div>

            {/* Segmented progress bar with milestone notches */}
            <div className="relative w-full">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-500 shadow-xs"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {/* Milestone notch at 20 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-300"
                style={{ left: `${(20 / TOTAL_TARGET) * 100}%` }}
              />
              {/* Labels */}
              <div className="flex justify-between text-[11px] font-bold mt-1.5 text-slate-500 px-0.5">
                <span>0</span>
                <span className={completedToday >= 20 ? 'text-emerald-700 font-extrabold' : ''}>🎁 20 orders</span>
                <span className={completedToday >= 30 ? 'text-emerald-800 font-extrabold' : ''}>⭐ 30 orders</span>
              </div>
            </div>

            {/* Motivation line */}
            <p className="text-xs font-semibold text-slate-700 pt-2 border-t border-emerald-100/80">
              {completedToday < 20 ? (
                <>Complete <strong className="text-emerald-700 font-extrabold">{20 - completedToday} more orders</strong> to unlock your first gift box!</>
              ) : completedToday < 30 ? (
                <>Only <strong className="text-emerald-700 font-extrabold">{30 - completedToday} orders left</strong> to unlock the ₹500 Legend Box!</>
              ) : (
                <span className="text-emerald-700 font-black flex items-center gap-1.5">
                  <PartyPopper className="w-4 h-4 text-emerald-600" /> All milestone boxes unlocked — you are a legend!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── SECTION LABEL ── */}
        <div className="flex items-center gap-2 px-0.5">
          <Gift className="w-4 h-4 text-emerald-600" />
          <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
            Mystery Gift Boxes
          </h2>
        </div>

        {/* ── MILESTONE GIFT BOX CARDS (horizontal layout, small gift image) ── */}
        <div className="flex flex-col gap-3">
          {MILESTONES.map((box) => {
            const unlocked = completedToday >= box.targetOrders;
            const claimed = claimedIds.includes(box.id);
            const remaining = Math.max(0, box.targetOrders - completedToday);
            const pct = Math.min(100, Math.round((completedToday / box.targetOrders) * 100));

            return (
              <div
                key={box.id}
                onClick={() => handleBoxTap(box)}
                className={`relative rounded-3xl border overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-150 ${
                  claimed
                    ? 'bg-slate-50 border-slate-200 shadow-2xs'
                    : unlocked
                    ? 'bg-white border-2 border-emerald-600 ring-4 ring-emerald-600/20 shadow-md shadow-emerald-600/10'
                    : 'bg-white border border-slate-200 shadow-2xs hover:border-emerald-200'
                }`}
              >
                {/* Unlocked glow strip — always emerald */}
                {unlocked && !claimed && (
                  <div className={`h-1 w-full bg-gradient-to-r ${box.accentFrom} ${box.accentTo}`} />
                )}

                <div className="p-4 flex items-center gap-4">
                  {/* Left: Gift box icon with transparent PNG */}
                  <div className="shrink-0 w-[72px] h-[72px] rounded-2xl flex items-center justify-center border-2 border-emerald-200/80 bg-emerald-50/70 relative">
                    <img
                      src="/images/rewards/gift_box.png"
                      alt="Gift Box"
                      className={`w-14 h-14 object-contain transition-transform duration-300 ${
                        unlocked && !claimed ? 'scale-110 drop-shadow-md' : 'scale-100 drop-shadow-xs'
                      }`}
                    />
                    {/* Lock badge — floating corner pill so gift box is 100% visible */}
                    {!unlocked && (
                      <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-slate-800 text-white shadow-md flex items-center justify-center border border-white/70">
                        <Lock className="w-3 h-3 text-white stroke-[2.5]" />
                      </div>
                    )}
                    {/* Claimed check */}
                    {claimed && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-600/90">
                        <Check className="w-8 h-8 text-white stroke-[3]" />
                      </div>
                    )}
                    {/* Pulse ring when unlocked */}
                    {unlocked && !claimed && (
                      <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-emerald-400 pointer-events-none" />
                    )}
                  </div>

                  {/* Right: Info block */}
                  <div className="flex-1 min-w-0">
                    {/* Tag pill — always Minnit green */}
                    <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5 ${
                      box.highlight
                        ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {box.tagLabel}
                    </span>

                    <h3 className="text-sm font-black text-slate-900 leading-snug">
                      {box.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                      {box.subtitle}
                    </p>

                    {/* Mini progress bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${box.accentFrom} ${box.accentTo} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-600 shrink-0">
                        {Math.min(completedToday, box.targetOrders)}/{box.targetOrders}
                      </span>
                    </div>

                    {/* Status pill */}
                    <div className="mt-2">
                      {claimed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Reward Claimed
                        </span>
                      ) : unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5" />
                          Unlocked! Tap to Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Lock className="w-3 h-3 text-slate-400" />
                          {remaining} more order{remaining !== 1 ? 's' : ''} to unlock
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* ── ACTIVE VOUCHERS ── */}
        {vouchers.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-0.5">
              <Award className="w-4 h-4 text-amber-600" />
              <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
                My Vouchers
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {vouchers.length}
              </span>
            </div>

            <div className="space-y-2">
              {vouchers.map((vch) => (
                <div
                  key={vch.id}
                  className="rounded-2xl bg-gradient-to-r from-amber-50 to-white border border-amber-200/80 p-3.5 flex items-center gap-3 shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                    <Sun className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{vch.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{vch.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Expires {vch.expiresAt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(vch.code)}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-black bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-slate-800 shadow-2xs cursor-pointer hover:bg-amber-50 active:scale-95 transition-all"
                  >
                    {copiedCode === vch.code ? (
                      <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700">Copied!</span></>
                    ) : (
                      <><Copy className="w-3.5 h-3.5 text-amber-700" /><span className="font-mono">{vch.code.split('-').slice(-1)[0]}</span></>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMPTY VOUCHER STATE ── */}
        {vouchers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center">
            <Gift className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No Vouchers Yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Complete 20–30 deliveries to unlock exclusive rewards & vouchers.
            </p>
          </div>
        )}

      </div>

      {/* ── MILESTONE DETAIL / REWARD CHOICE MODAL ── */}
      {openedBox && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm"
          onClick={() => { setOpenedBox(null); setModalState(null); }}
        >
          {/* Bottom Sheet — padded to clear fixed bottom nav (h-16 + safe area) */}
          <div
            className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-y-auto"
            style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))', maxHeight: '90dvh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="sticky top-0 pt-3 pb-1 bg-white z-10 flex justify-center">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => { setOpenedBox(null); setModalState(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors z-20"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>

            <div className="px-6 pt-2 pb-4">
              {/* Gift box display in modal — center aligned, proper size */}
              <div className="flex flex-col items-center gap-3 mb-5">
                <div className="relative w-28 h-28 rounded-3xl flex items-center justify-center border-2 border-emerald-200 bg-emerald-50/80 shadow-xs">
                  <img
                    src="/images/rewards/gift_box.png"
                    alt="Mystery Gift Box"
                    className="w-20 h-20 object-contain drop-shadow-md"
                  />
                  {completedToday < openedBox.targetOrders && (
                    <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md border border-white/70">
                      <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1 ${
                    openedBox.highlight
                      ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {openedBox.tagLabel}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{openedBox.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{openedBox.subtitle}</p>
                </div>
              </div>

              {/* CHOOSE REWARD (unlocked) */}
              {modalState === 'choose' ? (
                <div className="space-y-3">
                  <p className="text-center text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2 mb-1">
                    🎉 Milestone reached! Pick your reward:
                  </p>

                  {/* Cash Option */}
                  <div
                    onClick={() => handleClaimCash(openedBox)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-emerald-500 bg-white hover:bg-emerald-50/40 cursor-pointer active:scale-[0.98] transition-all shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900">{openedBox.rewards.cashOption.label}</p>
                      <p className="text-[11px] text-slate-500">{openedBox.rewards.cashOption.desc}</p>
                    </div>
                    <span className="text-[11px] font-black text-white bg-emerald-600 px-3 py-1.5 rounded-xl cursor-pointer shrink-0">
                      Claim Cash
                    </span>
                  </div>

                  {/* Voucher Option */}
                  <div
                    onClick={() => handleClaimVoucher(openedBox)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-emerald-800 bg-white hover:bg-emerald-50/40 cursor-pointer active:scale-[0.98] transition-all shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-900/10 border border-emerald-800/30 flex items-center justify-center shrink-0">
                      <Sun className="w-5 h-5 text-emerald-800" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900">{openedBox.rewards.productOption.title}</p>
                      <p className="text-[11px] text-slate-500">{openedBox.rewards.productOption.desc}</p>
                      <span className="inline-block mt-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {openedBox.rewards.productOption.value}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-white bg-emerald-800 px-3 py-1.5 rounded-xl cursor-pointer shrink-0">
                      Get Voucher
                    </span>
                  </div>
                </div>
              ) : (
                /* PREVIEW (locked) */
                <div className="space-y-3">
                  {/* Progress */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-1.5">
                      <span>Your Progress</span>
                      <span>{Math.min(completedToday, openedBox.targetOrders)} / {openedBox.targetOrders} orders</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${openedBox.accentFrom} ${openedBox.accentTo} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.round((completedToday / openedBox.targetOrders) * 100))}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-emerald-800 font-bold mt-2">
                      {Math.max(0, openedBox.targetOrders - completedToday) > 0
                        ? `Complete ${Math.max(0, openedBox.targetOrders - completedToday)} more orders to crack this box open!`
                        : 'Already claimed!'}
                    </p>
                  </div>

                  {/* What's inside preview */}
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest px-0.5">What&apos;s Inside:</p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{openedBox.rewards.cashOption.label}</p>
                      <p className="text-[11px] text-slate-500">{openedBox.rewards.cashOption.desc}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <Sun className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{openedBox.rewards.productOption.title} — {openedBox.rewards.productOption.value}</p>
                      <p className="text-[11px] text-slate-500">{openedBox.rewards.productOption.desc}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setOpenedBox(null); setModalState(null); }}
                    className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm cursor-pointer active:scale-[0.98] transition-all text-center"
                  >
                    Got it! Keep delivering 🚀
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

