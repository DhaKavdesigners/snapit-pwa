import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShoppingBag, Utensils } from 'lucide-react';
import { useContextStore } from '../../store/contextStore';

export const ContextToggle: React.FC = () => {
  const { activeContext, setContext } = useContextStore();
  const prefersReducedMotion = useReducedMotion();

  const isShopping = activeContext === 'shopping';

  return (
    <div className="bg-surface rounded-full p-1 flex relative w-[240px] mx-auto mb-4">
      <motion.div
        layoutId="context-toggle-bg"
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm"
        animate={{
          x: isShopping ? 0 : '100%',
        }}
        transition={{
          type: prefersReducedMotion ? 'tween' : 'spring',
          stiffness: 500,
          damping: 30,
          duration: prefersReducedMotion ? 0 : undefined
        }}
      />
      
      <button
        onClick={() => setContext('shopping')}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${isShopping ? 'text-text-primary' : 'text-text-secondary'}`}
        aria-label="Switch to Shopping"
      >
        <ShoppingBag className="w-4 h-4" />
        Shopping
      </button>
      
      <button
        onClick={() => setContext('food')}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${!isShopping ? 'text-text-primary' : 'text-text-secondary'}`}
        aria-label="Switch to Food"
      >
        <Utensils className="w-4 h-4" />
        Food
      </button>
    </div>
  );
};
