import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, ShoppingCart, Heart, User } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/cart', icon: ShoppingCart, label: 'Cart' },
  { path: '/favorites', icon: Heart, label: 'Favorites' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const cartItemsCount = useCartStore(state => state.items.reduce((acc, item) => acc + item.quantity, 0));

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background border-t border-gray-100 pb-safe z-50">
      <div className="flex justify-around items-center w-full px-2 h-14">

        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-full text-text-secondary active:scale-95 transition-transform"
              aria-label={item.label}
            >
              <div className="relative">
                <Icon 
                  className={`h-6 w-6 transition-colors ${isActive ? 'text-brand' : 'text-text-secondary'}`} 
                />
                {item.path === '/cart' && cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-brand text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-2 w-1 h-1 bg-brand rounded-full"
                  transition={{ 
                    type: prefersReducedMotion ? 'tween' : 'spring', 
                    stiffness: 500, 
                    damping: 30,
                    duration: prefersReducedMotion ? 0 : undefined
                  }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
