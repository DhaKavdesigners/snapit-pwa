import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useContextStore } from '../../store/contextStore';

const shoppingBanners = [
  { 
    id: 1, 
    title: 'Independence Day Specials', 
    subtitle: 'Up to 50% OFF',
    gradient: 'from-orange-500/80 via-white/20 to-green-500/80',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 2, 
    title: 'Midnight Essentials', 
    subtitle: 'Delivered in 10 mins',
    gradient: 'from-indigo-600/60 to-purple-900/80',
    img: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 3, 
    title: 'Fresh Produce Sale', 
    subtitle: 'Farm fresh to home',
    gradient: 'from-emerald-400/60 to-teal-700/80',
    img: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80' 
  },
];

const foodBanners = [
  { 
    id: 101, 
    title: 'Hot Dum Biriyani & Starters', 
    subtitle: 'Authentic Ambur Flavors delivered hot',
    gradient: 'from-amber-600/70 to-red-900/80',
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 102, 
    title: 'Crispy Shawarma & Burgers', 
    subtitle: 'Freshly grilled & loaded with flavor',
    gradient: 'from-orange-600/70 to-rose-950/80',
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 103, 
    title: 'Cheesy Pizzas & Cool Shakes', 
    subtitle: 'Hot slices, cold thickshakes in a snap',
    gradient: 'from-red-600/70 to-purple-900/80',
    img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' 
  },
];

export const BannerCarousel: React.FC = () => {
  const { activeContext } = useContextStore();
  const banners = activeContext === 'food' ? foodBanners : shoppingBanners;
  const [currentIndex, setCurrentIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Reset index on context change
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeContext]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-6 shadow-sm border border-gray-100">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: '100%' }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: '-100%' }}
          transition={{ type: 'tween', duration: 0.4 }}
          className="absolute inset-0 w-full h-full flex flex-col justify-end p-4"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img src={banners[currentIndex].img} alt="" className="w-full h-full object-cover" />
          </div>
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${banners[currentIndex].gradient} mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Text Content */}
          <div className="relative z-10 text-white pb-3">
            <h2 className="text-xl font-bold leading-tight drop-shadow-md">
              {banners[currentIndex].title}
            </h2>
            <p className="text-xs font-semibold opacity-90 drop-shadow-md">
              {banners[currentIndex].subtitle}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Pagination Dots */}
      <div className="absolute bottom-3 right-4 flex justify-center gap-1.5 z-20">
        {banners.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};
