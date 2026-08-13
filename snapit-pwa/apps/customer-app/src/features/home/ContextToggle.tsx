import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShoppingBag, Utensils } from 'lucide-react';
import { useContextStore } from '../../store/contextStore';

export const ContextToggle: React.FC = () => {
  const { activeContext, setContext } = useContextStore();
  const prefersReducedMotion = useReducedMotion();

  const isShopping = activeContext === 'shopping';

  return (
    <div className="bg-emerald-50/80 p-1 rounded-full border border-emerald-100 flex relative w-[240px] mx-auto mb-4">
      <motion.div
        layoutId="context-toggle-bg-emerald"
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-emerald-600 rounded-full shadow-md"
        animate={{
          x: isShopping ? 0 : '100%',
        }}
        transition={{
          type: prefersReducedMotion ? 'tween' : 'spring',
          stiffness: 500,
          damping: 30,
          duration: prefersReducedMotion ? 0 : 0.3
        }}
      />
      
      <button
        onClick={() => setContext('shopping')}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-5 py-2 text-sm transition-all duration-300 ${isShopping ? 'text-white font-bold' : 'text-emerald-900/60 hover:text-emerald-900 font-medium'}`}
        aria-label="Switch to Shopping"
      >
        <ShoppingBag className="w-4 h-4" />
        Shopping
      </button>
      
      <button
        onClick={() => setContext('food')}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-5 py-2 text-sm transition-all duration-300 ${!isShopping ? 'text-white font-bold' : 'text-emerald-900/60 hover:text-emerald-900 font-medium'}`}
        aria-label="Switch to Food"
      >
        <Utensils className="w-4 h-4" />
        Food
      </button>
    </div>
  );
};
