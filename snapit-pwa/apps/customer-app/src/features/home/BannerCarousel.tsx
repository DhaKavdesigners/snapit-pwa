import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const banners = [
  { id: 1, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=300&fit=crop', title: 'Fresh Produce Sale' },
  { id: 2, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=300&fit=crop', title: 'Craving Biryani?' },
  { id: 3, image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&h=300&fit=crop', title: 'Daily Essentials' },
];

export const BannerCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-6 bg-surface">
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={banners[currentIndex].image}
          alt={banners[currentIndex].title}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 100 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -100 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
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
