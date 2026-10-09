import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useBabyToastStore, BabyToastType } from '../../store/babyToastStore';

// ── Girl mascot: Catie (Shopping) ─────────────────────────────────────────────
// ── Boy mascot:  Momo  (Food)     ─────────────────────────────────────────────

const TOAST_CONFIG: Record<
  BabyToastType,
  { img: string; headline: string; sub: string; accent: string }
> = {
  // ── Catie — Shopping ────────────────────────────────────────────────────────
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
    sub: 'Your basket is filling up! 🥰',
    accent: 'from-teal-500 to-emerald-600',
  },
  favourite_saved: {
    img: '/baby/saved_favoraoite_toast.jpg',
    headline: 'Saved to Favourites!',
    sub: "She'll remember that for you 💝",
    accent: 'from-rose-400 to-pink-500',
  },
  // ── Momo — Food ─────────────────────────────────────────────────────────────
  food_first: {
    img: '/baby/boy_item_added.jpg',
    headline: 'Order up!',
    sub: 'Momo is getting hungry! 🍕',
    accent: 'from-orange-500 to-amber-500',
  },
  food_pizza: {
    img: '/baby/boy_pizza_added.jpg',
    headline: 'Pizza in the bag!',
    sub: 'Cheesy goodness coming up! 🧀',
    accent: 'from-amber-500 to-yellow-500',
  },
  food_burger: {
    img: '/baby/boy_burger_added.jpg',
    headline: 'Juicy Burger added!',
    sub: 'Momo loves a good burger 🍔',
    accent: 'from-amber-500 to-yellow-500',
  },
  food_biriyani: {
    img: '/baby/boy_biriyani_aroma.jpg',
    headline: 'Mmm… Biriyani! 🍛',
    sub: 'Momo can already smell it — amazing!',
    accent: 'from-yellow-500 to-orange-500',
  },
  food_more: {
    img: '/baby/boy_biriyani_aroma_small.jpg',
    headline: 'More food!',
    sub: 'Momo says this is going to be a feast 🎉',
    accent: 'from-orange-400 to-red-500',
  },
  food_favourite: {
    img: '/baby/saved_favoraoite_toast.jpg',
    headline: 'Saved to Favourites!',
    sub: 'That dish is bookmarked for later 💛',
    accent: 'from-amber-400 to-orange-500',
  },
};

export const BabyToast: React.FC = () => {
  const { visible, type, productName, hideToast } = useBabyToastStore();
  const navigate = useNavigate();
  const config = type ? TOAST_CONFIG[type] : null;

  return (
    <AnimatePresence>
      {visible && config && (
        <motion.div
          key={type}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -35, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 440, damping: 28 }}
          className="fixed top-3 left-1/2 z-[250] pointer-events-auto"
          style={{ x: '-50%', transform: 'translateX(-50%)' }}
        >
          <div 
            onClick={() => {
              hideToast();
              navigate('/cart');
            }}
            className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-emerald-100 pr-2.5 overflow-hidden w-[92vw] max-w-[340px] cursor-pointer active:scale-[0.98] transition-transform select-none"
          >
            {/* Mascot avatar */}
            <div className={`w-12 h-12 shrink-0 bg-gradient-to-br ${config.accent} relative overflow-hidden rounded-l-2xl`}>
              <img
                src={config.img}
                alt="Minnit mascot"
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Text & Quick View Bag shortcut */}
            <div className="flex-1 py-2 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-black text-xs text-gray-900 leading-tight">{config.headline}</p>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                  View Bag <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
              {productName && (
                <p className="text-[11px] font-bold text-emerald-800 truncate mt-0.5">{productName}</p>
              )}
              <p className="text-[9.5px] text-gray-500 mt-0.5 leading-tight truncate">{config.sub}</p>
            </div>

            {/* Dismiss */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                hideToast();
              }}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};