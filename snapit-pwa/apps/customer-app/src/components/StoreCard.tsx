import React, { useState } from 'react';
import { Store } from '../types';
import { Star } from 'lucide-react';

interface StoreCardProps {
  store: Store;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const [logoSrc, setLogoSrc] = useState(store.logoUrl);

  const handleLogoError = () => {
    if (store.fallbackLogoUrl && logoSrc !== store.fallbackLogoUrl) {
      setLogoSrc(store.fallbackLogoUrl);
    }
  };

  return (
    <div className="flex flex-col items-center bg-white rounded-2xl p-3 shadow-sm hover:shadow-md border border-gray-100 min-w-[100px] snap-start shrink-0 transition-all duration-200 active:scale-95">
      <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-gray-100 shadow-inner">
        <img
          src={logoSrc}
          alt={store.name}
          onError={handleLogoError}
          className="w-full h-full object-cover"
        />
      </div>

      <h4 className="font-bold text-xs text-gray-900 text-center line-clamp-2 w-full leading-tight mb-1">
        {store.name}
      </h4>

      <div className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-500">
        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
        {store.rating.toFixed(1)}
      </div>

      <div className="mt-1.5">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${store.isOpen ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {store.isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
    </div>
  );
};
