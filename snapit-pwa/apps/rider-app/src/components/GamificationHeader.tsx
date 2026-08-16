/**
 * GamificationHeader.tsx — Glassmorphic daily performance widget
 *
 * Displays "🏆 Today's Deliveries: [X]" with animated counter,
 * rider name, and online/offline status pill.
 */

import { useEffect, useRef } from 'react';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRiderStore, selectRider, selectIsOnline, selectDailyCount } from '../stores/riderStore';
import { Wifi, WifiOff } from 'lucide-react';

// ── Animated Number Counter ──────────────────────────────────────────────────

function AnimatedCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => Math.round(v));
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    });
    prevValue.current = value;
    return controls.stop;
  }, [value, motionValue]);

  return (
    <motion.span className="text-4xl font-extrabold text-white tabular-nums">
      {display}
    </motion.span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface GamificationHeaderProps {
  className?: string;
}

export function GamificationHeader({ className = '' }: GamificationHeaderProps) {
  const rider = useRiderStore(selectRider);
  const isOnline = useRiderStore(selectIsOnline);
  const dailyCount = useRiderStore(selectDailyCount);

  const firstName = rider?.name?.split(' ')[0] ?? 'Rider';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Brand gradient background */}
      <div className="brand-gradient absolute inset-0" />

      {/* Decorative orb — top right */}
      <div
        className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }}
      />
      {/* Decorative orb — bottom left */}
      <div
        className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }}
      />

      {/* Glassmorphic inner card */}
      <div className="relative z-10 p-5">
        {/* Top row: greeting + status pill */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-emerald-200 text-xs font-medium tracking-wide uppercase">
              {greeting}
            </p>
            <h2 className="text-white text-xl font-bold mt-0.5 leading-tight">
              {firstName} 👋
            </h2>
            {rider?.vehicleNumber && (
              <p className="text-emerald-300 text-xs font-medium mt-1 opacity-80">
                🛵 {rider.vehicleNumber}
              </p>
            )}
          </div>

          {/* Online / Offline status pill */}
          <motion.div
            animate={{
              backgroundColor: isOnline ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-white/20"
          >
            <motion.div
              animate={{ scale: isOnline ? [1, 1.3, 1] : 1 }}
              transition={{ repeat: isOnline ? Infinity : 0, duration: 2, ease: 'easeInOut' }}
            >
              {isOnline
                ? <Wifi size={13} className="text-white" />
                : <WifiOff size={13} className="text-white/60" />
              }
            </motion.div>
            <span className={`text-xs font-semibold ${isOnline ? 'text-white' : 'text-white/50'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </motion.div>
        </div>

        {/* Bottom row: gamification counter */}
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          <div className="flex-1">
            <p className="text-emerald-200 text-xs font-medium leading-none mb-1">
              Today's Deliveries
            </p>
            <AnimatedCounter value={dailyCount} />
          </div>
          <div className="text-right">
            <p className="text-emerald-200 text-xs font-medium leading-none mb-1">
              Est. Earnings
            </p>
            <p className="text-white font-bold text-lg">
              ₹{Math.floor(dailyCount * 42)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
