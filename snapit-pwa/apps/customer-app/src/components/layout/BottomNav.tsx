import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

interface NavItem {
  path: string;
  label: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
  activePillBg?: string;
  activeTextColor?: string;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    activePillBg: 'bg-emerald-100',
    activeTextColor: 'text-emerald-800',
    renderIcon: (isActive) =>
      isActive ? (
        // Solid green house with clean white door cutout
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-800" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5L2.5 10.5h2.5v10h4.5v-5.5h5v5.5h4.5v-10h2.5L12 2.5z" />
        </svg>
      ) : (
        // Outline house
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-gray-400 fill-none stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
        </svg>
      ),
  },
  {
    path: '/explore',
    label: 'Explore',
    activePillBg: 'bg-emerald-100',
    activeTextColor: 'text-emerald-800',
    renderIcon: (isActive) =>
      isActive ? (
        // Solid green compass with distinct white needle inside
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9.5" className="fill-emerald-800" />
          <polygon points="12,5.5 14.5,12 12,10.5 9.5,12" className="fill-white" />
          <polygon points="12,18.5 14.5,12 12,13.5 9.5,12" className="fill-emerald-300" />
          <circle cx="12" cy="12" r="1.5" className="fill-emerald-950" />
        </svg>
      ) : (
        // Outline compass
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-gray-400 fill-none stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="none" />
        </svg>
      ),
  },
  {
    path: '/cart',
    label: 'Bag',
    activePillBg: 'bg-emerald-100',
    activeTextColor: 'text-emerald-800',
    renderIcon: (isActive) =>
      isActive ? (
        // Solid green shopping bag with white handle cutout (matching reference image)
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 7h12l1.5 13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5L6 7z" className="fill-emerald-800" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="#065f46" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M9 11a3 3 0 0 0 6 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      ) : (
        // Outline shopping bag
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-gray-400 fill-none stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
  },
  {
    path: '/favorites',
    label: 'Favorites',
    activePillBg: '',
    activeTextColor: 'text-rose-500',
    renderIcon: (isActive) =>
      isActive ? (
        // Exact original solid red heart
        <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
      ) : (
        <Heart className="w-5 h-5 text-gray-400 fill-none stroke-[1.8]" />
      ),
  },
  {
    path: '/profile',
    label: 'Profile',
    activePillBg: 'bg-emerald-100',
    activeTextColor: 'text-emerald-800',
    renderIcon: (isActive) =>
      isActive ? (
        // Solid green user profile
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="7" r="4.2" className="fill-emerald-800" />
          <path d="M4 20.5v-1.5a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1.5H4z" className="fill-emerald-800" />
        </svg>
      ) : (
        // Outline user profile
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-gray-400 fill-none stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
  },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const cartItemsCount = useCartStore((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-gray-100/90 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-safe z-50">
      <div className="flex justify-around items-center w-full px-2 h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const activeTextColor = item.activeTextColor || 'text-emerald-800';
          const activePillBg = item.activePillBg || 'bg-emerald-100';

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-0.5 select-none transition-transform active:scale-95 group"
              aria-label={item.label}
            >
              {/* Icon Container with Circular Pill on Active */}
              <div
                className={`relative flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? `w-8 h-8 rounded-full ${activePillBg} shadow-2xs`
                    : 'w-8 h-8 rounded-full bg-transparent'
                }`}
              >
                {item.renderIcon(isActive)}

                {/* Bag Live Counter Badge */}
                {item.path === '/cart' && cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black min-w-4 h-4 px-1 flex items-center justify-center rounded-full shadow-xs border border-white">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </div>

              {/* Naming Label */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 transition-all duration-150 ${
                  isActive
                    ? `${activeTextColor} font-black scale-105`
                    : 'text-gray-400 font-semibold group-hover:text-gray-600'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
