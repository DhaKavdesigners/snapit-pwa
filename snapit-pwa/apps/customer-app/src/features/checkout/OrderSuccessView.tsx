import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, MapPin, ShoppingBag, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/currency';

// ── Premium 3-note success chime — subtle, <1 second ─────────────────────────
const playSuccessChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // E5 → G#5 → B5  (major triad arpeggio, very soft)
    [
      { freq: 659.25, t: 0 },
      { freq: 830.61, t: 0.15 },
      { freq: 987.77, t: 0.30 },
    ].forEach(({ freq, t }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.5);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.55);
    });
  } catch {
    /* browser blocked — silent fail */
  }
};

export const OrderSuccessView: React.FC = () => {
  const navigate      = useNavigate();
  const { lastOrder } = useCartStore();
  const soundPlayed   = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!soundPlayed.current) {
      soundPlayed.current = true;
      setTimeout(playSuccessChime, 100); // slight delay so animation leads
    }
  }, []);

  // ── Derived display values ────────────────────────────────────────────────
  const orderId      = lastOrder?.orderId ?? `SN${Math.floor(Math.random() * 99999999).toString().padStart(8, '0')}`;
  const total        = lastOrder?.total   ?? 0;
  const isPaid       = lastOrder?.paymentMethod === 'upi';
  const payLabel     = isPaid ? 'Paid Online' : 'Pay at Delivery';
  const itemNames    = lastOrder?.itemNames ?? [];
  const top2Items    = itemNames.slice(0, 2);
  const extraCount   = itemNames.length - top2Items.length;

  // ── Static ETA for Phase 1 ───────────────────────────────────────────────
  const etaText = '20–35 min';

  return (
    <div className="max-w-md mx-auto relative flex flex-col min-h-screen bg-brand overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-20 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 pt-16 pb-10 flex-1">

        {/* ── Animated check with ripple ── */}
        <div className="relative mb-7">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.05 }}
            className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)]"
          >
            <CheckCircle2 className="w-16 h-16 text-brand" />
          </motion.div>
          {/* Ripple ring */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0.5 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 bg-white/15 rounded-full pointer-events-none"
          />
        </div>

        {/* ── Headline ── */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="text-center mb-6 w-full"
        >
          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Order Placed!</h1>
          <p className="text-white/70 text-sm">
            {itemNames.length > 0
              ? `${itemNames.length} item${itemNames.length > 1 ? 's' : ''} on the way`
              : 'Your order is on the way'}
          </p>
        </motion.div>

        {/* ── Order Brief Card ── */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="w-full bg-white/12 backdrop-blur-md border border-white/20 rounded-3xl p-5 mb-5 space-y-3"
        >
          {/* Order ID */}
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-[11px] uppercase tracking-widest font-bold">Order ID</span>
            <span className="font-mono text-sm font-black text-white tracking-widest">{orderId}</span>
          </div>

          <div className="border-t border-white/15" />

          {/* Amount + paid/due */}
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-[11px] uppercase tracking-widest font-bold">Amount</span>
            <div className="text-right">
              <p className="font-black text-base text-white">{formatCurrency(total)}</p>
              <p className={`text-[10px] font-semibold ${isPaid ? 'text-emerald-300' : 'text-amber-300'}`}>{payLabel}</p>
            </div>
          </div>

          {/* ETA */}
          <div className="border-t border-white/15" />
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-[11px] uppercase tracking-widest font-bold">Estimated Delivery</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/60" />
              <span className="font-bold text-sm text-white">{etaText}</span>
            </div>
          </div>

          {/* Item summary */}
          {top2Items.length > 0 && (
            <>
              <div className="border-t border-white/15" />
              <div>
                <span className="text-white/50 text-[11px] uppercase tracking-widest font-bold block mb-1.5">Your Order</span>
                {top2Items.map((name, i) => (
                  <p key={i} className="text-white/85 text-sm leading-snug">• {name}</p>
                ))}
                {extraCount > 0 && (
                  <p className="text-white/50 text-xs mt-0.5">+{extraCount} more item{extraCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* ── Status pill ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8"
        >
          <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold">Order confirmed — being prepared</span>
        </motion.div>

        {/* ── Dual CTA ── */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="w-full flex flex-col gap-3 mt-auto"
        >
          {/* Primary — Track Order */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full h-14 rounded-2xl bg-white text-brand font-black text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <MapPin className="w-5 h-5" />
            Track Order
          </button>

          {/* Secondary — Continue Shopping */}
          <button
            onClick={() => navigate('/')}
            className="w-full rounded-2xl border-2 border-white/35 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:bg-white/20 transition-colors py-3.5"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </button>
        </motion.div>
      </div>
    </div>
  );
};
