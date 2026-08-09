import React from 'react';
import { Store } from '../types';
import { Star } from 'lucide-react';

interface StoreCardProps {
  store: Store;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  return (
    <div className="flex flex-col items-center bg-surface rounded-2xl p-3 shadow-sm min-w-[100px] snap-start shrink-0">
      <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-white">
        <img 
          src={store.logoUrl} 
          alt={store.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <h4 className="font-medium text-sm text-text-primary text-center line-clamp-1 w-full">
        {store.name}
      </h4>
      <div className="flex items-center mt-1 text-xs font-medium text-text-secondary">
        <Star className="h-3 w-3 text-accent fill-accent mr-1" />
        {store.rating.toFixed(1)}
      </div>
    </div>
  );
};
