import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useBabyToastStore, BabyToastType } from '../../store/babyToastStore';

const TOAST_CONFIG: Record<
  BabyToastType,
  { img: string; headline: string; sub: string; accent: string }
> = {
  item_added_first: {
    img: '/baby/iteam_added_toast.jpg',
    headline: 'Yay! Added to cart!',
    sub: 'She is so happy for you! 💚',
    accent: 'from-emerald-500 to-teal-500',
  },
  item_added: {
    img: '/baby/iteam_added.jpg',
    headline: 'Added!',
    sub: 'Great pick! Keep going 🛒',
    accent: 'from-emerald-500 to-brand',
  },
  more_item: {
    img: '/baby/more_item_added.jpg',
    headline: 'More goodies!',
    sub: "Mama's basket is filling up! 🥰",
    accent: 'from-teal-500 to-emerald-600',
  },
  favourite_saved: {
    img: '/baby/saved_favoraoite_toast.jpg',
    headline: 'Saved to Favourites!',
    sub: "She'll remember that for Mama 💝",
    accent: 'from-rose-400 to-pink-500',
  },
};

export const BabyToast: React.FC = () => {
  const { visible, type, productName, hideToast } = useBabyToastStore();
  const config = type ? TOAST_CONFIG[type] : null;

  return (
    <AnimatePresence>
      {visible && config && (
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 80, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="fixed bottom-20 left-1/2 z-[200] pointer-events-auto"
          style={{ x: '-50%', transform: 'translateX(-50%)' }}
        >
          <div
            className="flex items-center gap-3 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-gray-100 pr-4 overflow-hidden max-w-[300px] w-[280px]"
          >
            {/* Baby avatar */}
            <div className={`w-16 h-16 shrink-0 bg-gradient-to-br ${config.accent} relative overflow-hidden`}>
              <img
                src={config.img}
                alt="Minnit mascot"
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Text */}
            <div className="flex-1 py-3 min-w-0">
              <p className="font-black text-sm text-gray-900 leading-tight">{config.headline}</p>
              {productName && (
                <p className="text-[11px] font-bold text-emerald-700 truncate mt-0.5">{productName}</p>
              )}
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{config.sub}</p>
            </div>

            {/* Dismiss */}
            <button
              onClick={hideToast}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};