import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, MapPin, ShoppingBag, Clock, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/currency';

// ── Premium triumphant 4-note celebration chime ──────────────────────────────
const playSuccessChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    // C5 → E5 → G5 → C6 (Triumphant major resolution)
    [
      { freq: 523.25, t: 0, dur: 0.2 },
      { freq: 659.25, t: 0.12, dur: 0.2 },
      { freq: 783.99, t: 0.24, dur: 0.25 },
      { freq: 1046.50, t: 0.38, dur: 0.65 },
    ].forEach(({ freq, t, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur);
    });
  } catch {}
};

// Simple floating celebratory confetti dots
const confettiParticles = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 8 + 4,
  color: ['#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A7F3D0', '#FFFFFF'][i % 6],
  delay: Math.random() * 0.8,
  duration: Math.random() * 2 + 2,
}));

export const OrderSuccessView: React.FC = () => {
  const navigate      = useNavigate();
  const { lastOrder } = useCartStore();
  const soundPlayed   = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!soundPlayed.current) {
      soundPlayed.current = true;
      setTimeout(playSuccessChime, 80);
    }
  }, []);

  // ── Derived display values ────────────────────────────────────────────────
  const orderId      = lastOrder?.orderId ?? `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const total        = lastOrder?.total   ?? 5800;
  const itemNames    = lastOrder?.itemNames ?? [];
  const top2Items    = itemNames.slice(0, 2);
  const extraCount   = itemNames.length - top2Items.length;

  return (
    <div className="max-w-md mx-auto relative flex flex-col min-h-screen bg-gradient-to-b from-emerald-600 via-brand to-emerald-900 overflow-hidden text-white shadow-2xl">
      {/* Floating celebratory particles */}
      {confettiParticles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: -20, scale: 0 }}
          animate={{ 
            opacity: [0, 0.8, 0], 
            y: [p.y - 20, p.y + 40],
            scale: [0, 1.2, 0.8],
            rotate: [0, 180, 360]
          }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: 'easeInOut'
          }}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color
          }}
          className="absolute rounded-full pointer-events-none z-0"
        />
      ))}

      {/* Radiant background glowing aura */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 pt-12 pb-8 flex-1">

        {/* ── Animated Checkmark Ring with Radiant Wave ── */}
        <div className="relative mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.4)] border-4 border-emerald-300"
          >
            <CheckCircle2 className="w-16 h-16 text-brand" />
          </motion.div>

          {/* Glowing pulse rings */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 bg-white/25 rounded-full pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 bg-emerald-300/20 rounded-full pointer-events-none"
          />
        </div>

        {/* ── Headline & Feel-Good Praise ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center mb-6 w-full"
        >
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-100 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            Order Placed Successfully!
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
            Woohoo! You're all set 🎉
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1 font-medium">
            Your items are packed and our rider is on the move.
          </p>
        </motion.div>

        {/* ── Order Summary Glass Card ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="w-full bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl p-5 mb-5 space-y-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
        >
          {/* Order ID & Status */}
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-[11px] uppercase tracking-widest font-black">Order ID</span>
            <span className="font-mono text-sm font-black text-white bg-black/20 px-2.5 py-0.5 rounded-lg tracking-widest border border-white/10">
              {orderId}
            </span>
          </div>

          <div className="border-t border-white/15" />

          {/* Amount Paid */}
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-[11px] uppercase tracking-widest font-black">Total Paid</span>
            <div className="text-right">
              <p className="font-black text-xl text-white font-mono">{formatCurrency(total)}</p>
              <p className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">100% Prepaid via UPI</p>
            </div>
          </div>

          <div className="border-t border-white/15" />

          {/* Estimated Delivery */}
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-[11px] uppercase tracking-widest font-black">Estimated Delivery</span>
            <div className="flex items-center gap-1.5 bg-emerald-500/30 px-2.5 py-1 rounded-xl border border-emerald-300/30">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-black text-xs text-white">10–15 Minutes</span>
            </div>
          </div>

          {/* Items Summary */}
          {top2Items.length > 0 && (
            <>
              <div className="border-t border-white/15" />
              <div>
                <span className="text-white/70 text-[10px] uppercase tracking-widest font-black block mb-1.5">
                  Items in bag ({itemNames.length})
                </span>
                {top2Items.map((name, i) => (
                  <p key={i} className="text-white/90 text-xs font-semibold leading-snug flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    {name}
                  </p>
                ))}
                {extraCount > 0 && (
                  <p className="text-white/60 text-[11px] mt-0.5 pl-3">+{extraCount} more item{extraCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* ── Status Pill ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6"
        >
          <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
          <span className="text-white text-xs font-bold">Store counter is preparing your order</span>
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="w-full flex flex-col gap-3 mt-auto"
        >
          {/* Primary Track Order */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full h-14 rounded-2xl bg-white text-brand font-black text-base flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase tracking-wider"
          >
            <MapPin className="w-5 h-5 text-brand" />
            Track Order Live
          </button>

          {/* Secondary Continue Shopping */}
          <button
            onClick={() => navigate('/')}
            className="w-full rounded-2xl border-2 border-white/35 bg-white/5 hover:bg-white/15 active:bg-white/25 text-white font-bold text-sm flex items-center justify-center gap-2 py-3.5 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </button>
        </motion.div>
      </div>
    </div>
  );
};
