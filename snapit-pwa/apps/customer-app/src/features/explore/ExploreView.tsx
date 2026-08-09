import React from 'react';
import { SearchBar } from '../home/SearchBar';

const exploreCategories = [
  { id: '1', name: 'Groceries', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
  { id: '2', name: 'Bakery', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
  { id: '3', name: 'Meat & Chicken', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80' },
  { id: '4', name: 'Snacks', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&q=80' },
  { id: '5', name: 'Pharmacy', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80' },
  { id: '6', name: 'Flowers', imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80' }
];

export const ExploreView: React.FC = () => {
  return (
    <div className="p-4 pt-2 pb-24 h-full overflow-y-auto">
      <SearchBar />
      
      <h2 className="font-bold text-xl text-text-primary mb-4">Categories</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {exploreCategories.map(category => (
          <div 
            key={category.id} 
            className="flex flex-col bg-surface rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-full aspect-square bg-gray-100 overflow-hidden">
              <img 
                src={category.imageUrl} 
                alt={category.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="p-3 text-center">
              <span className="font-bold text-sm text-text-primary">{category.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
