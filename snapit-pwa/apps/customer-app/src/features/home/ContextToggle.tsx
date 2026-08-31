import React from 'react';
import { ShoppingBag, Utensils } from 'lucide-react';
import { useContextStore } from '../../store/contextStore';

export const ContextToggle: React.FC = () => {
  const { activeContext, setContext } = useContextStore();
  const isShopping = activeContext === 'shopping';

  return (
    <div className="flex justify-center mb-4">
      <div className="relative inline-flex items-center justify-center bg-emerald-50/90 p-1.5 rounded-full border border-emerald-100/80 shadow-inner w-[248px]">
        <button
          onClick={() => setContext('shopping')}
          className={`relative z-10 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition-all duration-300 w-1/2 rounded-full cursor-pointer select-none ${
            isShopping 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
              : 'text-emerald-900/70 hover:text-emerald-900 bg-transparent'
          }`}
          aria-label="Switch to Shopping"
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span>Shopping</span>
        </button>
        
        <button
          onClick={() => setContext('food')}
          className={`relative z-10 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition-all duration-300 w-1/2 rounded-full cursor-pointer select-none ${
            !isShopping 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
              : 'text-emerald-900/70 hover:text-emerald-900 bg-transparent'
          }`}
          aria-label="Switch to Food"
        >
          <Utensils className="w-4 h-4 shrink-0" />
          <span>Food</span>
        </button>
      </div>
    </div>
  );
};
