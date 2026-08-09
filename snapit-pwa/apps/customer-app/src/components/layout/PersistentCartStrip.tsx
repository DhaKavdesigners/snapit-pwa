import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useProducts } from '../../api/queries';
import { useContextStore } from '../../store/contextStore';
import { formatCurrency } from '../../utils/currency';

export const PersistentCartStrip: React.FC = () => {
  const { items } = useCartStore();
  const { activeContext } = useContextStore();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  
  // We need to fetch products to calculate the mock estimated total
  // In a real app, this might come from a more robust cart calculation on the backend
  // or a locally cached product dictionary.
  const { data: products = [] } = useProducts(activeContext);
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  const estimatedTotalPaise = items.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId);
    return acc + (product ? product.price * item.quantity : 0);
  }, 0);

  const isVisible = totalItems > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[calc(28rem-32px)] z-40"
        >
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-brand text-white rounded-2xl p-4 flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform"
            aria-label="View Cart"
          >
            <div className="flex flex-col items-start">
              <span className="font-bold text-sm">
                {totalItems} item{totalItems > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-white/90 font-medium">
                {formatCurrency(estimatedTotalPaise)} (estimated)
              </span>
            </div>
            <div className="flex items-center gap-1 font-bold text-sm">
              View Cart <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
