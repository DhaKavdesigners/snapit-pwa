import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ShoppingBag, Bike, Zap, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "../../store/cartStore";
import { useOrderStore } from "../../store/orderStore";
import { formatCurrency } from "../../utils/currency";

const playSuccessChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    [
      { freq: 523.25, t: 0,    dur: 0.20 },
      { freq: 659.25, t: 0.12, dur: 0.20 },
      { freq: 783.99, t: 0.24, dur: 0.25 },
      { freq: 1046.50,t: 0.38, dur: 0.65 },
    ].forEach(({ freq, t, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + dur);
    });
  } catch {}
};

const confettiParticles = Array.from({ length: 16 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 7 + 4,
  color: ["#34D399","#FBBF24","#60A5FA","#F472B6","#A7F3D0","#FFFFFF"][i % 6],
  delay: Math.random() * 0.8, duration: Math.random() * 2 + 2,
}));

export const OrderSuccessView: React.FC = () => {
  const navigate      = useNavigate();
  const { lastOrder } = useCartStore();
  const soundPlayed   = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!soundPlayed.current) { soundPlayed.current = true; setTimeout(playSuccessChime, 80); }
  }, []);

  const orderId    = lastOrder?.orderId   ?? `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const total      = lastOrder?.total     ?? 0;
  const itemNames  = lastOrder?.itemNames ?? [];
  const storeName  = (lastOrder as any)?.storeName ?? "Minnit Store";
  const top2Items  = itemNames.slice(0, 2);
  const extraCount = itemNames.length - top2Items.length;

  return (
    <div className="max-w-md mx-auto relative flex flex-col min-h-screen bg-gradient-to-b from-emerald-600 via-brand to-emerald-900 overflow-hidden text-white shadow-2xl">
      {confettiParticles.map((p) => (
        <motion.div key={p.id}
          initial={{ opacity: 0, y: -20, scale: 0 }}
          animate={{ opacity: [0, 0.8, 0], y: [p.y - 20, p.y + 40], scale: [0, 1.2, 0.8], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: p.duration, delay: p.delay, ease: "easeInOut" }}
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, backgroundColor: p.color }}
          className="absolute rounded-full pointer-events-none z-0"
        />
      ))}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 pt-10 pb-8 flex-1">

        {/* ① SUCCESS */}
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
          className="relative mb-5">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.4)] border-4 border-emerald-300">
            <CheckCircle2 className="w-14 h-14 text-brand" />
          </div>
          <motion.div initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: "easeOut" }}
            className="absolute inset-0 bg-white/25 rounded-full pointer-events-none" />
          <motion.div initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 2.2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0.8, ease: "easeOut" }}
            className="absolute inset-0 bg-emerald-300/20 rounded-full pointer-events-none" />
        </motion.div>

        {/* Headline */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.22 }} className="text-center mb-5 w-full">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-100 mb-2.5">
            🎉 Order Confirmed!
          </div>
          <h1 className="text-[1.55rem] font-black text-white tracking-tight leading-snug">
            You're all set —<br />we're getting it ready.
          </h1>
        </motion.div>

        {/* ② DELIVERY TIME */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl px-5 py-3.5 mb-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <span className="text-white font-black text-base">Arriving in</span>
          </div>
          <span className="font-black text-xl text-amber-300">10–15 mins</span>
        </motion.div>

        {/* ③ STORE STATUS */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
          className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 mb-5 w-full">
          <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping shrink-0" />
          <Store className="w-4 h-4 text-emerald-200 shrink-0" />
          <span className="text-white text-xs font-bold">{storeName} is preparing your order</span>
        </motion.div>

        {/* ④ ORDER DETAILS */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.44 }}
          className="w-full bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl p-5 mb-5 space-y-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.15)]">

          <div className="flex items-center justify-between">
            <span className="text-white/70 text-[11px] uppercase tracking-widest font-black">Order ID</span>
            <span className="font-mono text-sm font-black text-white bg-black/20 px-2.5 py-0.5 rounded-lg tracking-widest border border-white/10">{orderId}</span>
          </div>

          <div className="border-t border-white/15" />

          <div className="flex items-center justify-between">
            <span className="text-white/70 text-[11px] uppercase tracking-widest font-black">Total</span>
            <span className="font-black text-xl text-white font-mono">{formatCurrency(total)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/70 text-[11px] uppercase tracking-widest font-black">Paid via</span>
            <span className="text-xs font-black text-emerald-200 bg-emerald-500/20 border border-emerald-300/20 px-2.5 py-0.5 rounded-full">UPI · 100% Paid</span>
          </div>

          {top2Items.length > 0 && (
            <>
              <div className="border-t border-white/15" />
              <div>
                <span className="text-white/70 text-[10px] uppercase tracking-widest font-black block mb-2">
                  Your Order · {itemNames.length} item{itemNames.length !== 1 ? "s" : ""}
                </span>
                {top2Items.map((name, i) => (
                  <p key={i} className="text-white/90 text-xs font-semibold leading-snug flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
                    {name}
                  </p>
                ))}
                {extraCount > 0 && (
                  <p className="text-white/60 text-[11px] mt-0.5 pl-3">+{extraCount} more item{extraCount > 1 ? "s" : ""}</p>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* ⑤ ACTIONS */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.54 }} className="w-full flex flex-col gap-3 mt-auto">
          <button
            onClick={() => { useOrderStore.getState().setTrackerOpen(true, orderId); navigate("/"); }}
            className="w-full h-14 rounded-2xl bg-white text-brand font-black text-base flex items-center justify-center gap-2.5 shadow-[0_10px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <Bike className="w-5 h-5 text-brand" />
            Track Order →
          </button>
          <button onClick={() => navigate("/")}
            className="w-full rounded-2xl border-2 border-white/35 bg-white/5 hover:bg-white/15 active:bg-white/25 text-white font-bold text-sm flex items-center justify-center gap-2 py-3.5 transition-all">
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </button>
        </motion.div>

      </div>
    </div>
  );
};
