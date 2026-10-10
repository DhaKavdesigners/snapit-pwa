import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useFlyToCartStore, FlyingItem } from '../../store/flyToCartStore';

const FlyingBadge: React.FC<{ item: FlyingItem; onComplete: () => void }> = ({ item, onComplete }) => {
  const prefersReducedMotion = useReducedMotion();

  // If user prefers reduced motion, skip flying animation
  if (prefersReducedMotion) {
    return null;
  }

  // Parabolic path control points:
  // Arc tosses slightly up before accelerating downward into the bottom tray/cart
  const arcPeakY = Math.min(item.startY, item.endY) - 45;
  const arcMidX = (item.startX + item.endX) / 2 + (item.startX < item.endX ? 15 : -15);

  return (
    <motion.div
      initial={{
        x: item.startX - 24,
        y: item.startY - 24,
        scale: 0.85,
        opacity: 0.95,
      }}
      animate={{
        x: [item.startX - 24, arcMidX - 24, item.endX - 24],
        y: [item.startY - 24, arcPeakY - 24, item.endY - 24],
        scale: [0.85, 1.25, 0.35],
        opacity: [0.95, 1, 0.9, 0],
        rotate: [0, -12, 15, 0],
      }}
      transition={{
        duration: 0.62,
        ease: [0.25, 0.9, 0.3, 1], // natural physical parabolic toss curve
        times: [0, 0.42, 1],
      }}
      onAnimationComplete={onComplete}
      className={`fixed top-0 left-0 w-12 h-12 rounded-full overflow-hidden p-0.5 bg-white shadow-2xl z-[9999] pointer-events-none select-none border-2 ${
        item.isFood
          ? 'border-amber-400 ring-2 ring-amber-300/50 shadow-[0_10px_25px_rgba(245,158,11,0.5)]'
          : 'border-emerald-500 ring-2 ring-emerald-300/50 shadow-[0_10px_25px_rgba(5,150,105,0.45)]'
      }`}
    >
      <img
        src={item.imageUrl}
        alt=""
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    </motion.div>
  );
};

export const FlyToCartOverlay: React.FC = () => {
  const { items, removeItem } = useFlyToCartStore();

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <FlyingBadge
            key={item.id}
            item={item}
            onComplete={() => removeItem(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
