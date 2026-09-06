import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';

interface NavItem {
  path: string;
  label: string;
  renderIcon: (isActive: boolean, cartCount?: number) => React.ReactNode;
  activePillBg?: string;
  activeTextColor?: string;
}

/** Animated baby mascot icon for the Cart tab */
const BabyCartIcon: React.FC<{ isActive: boolean; cartCount: number }> = ({ isActive, cartCount }) => {
  const controls = useAnimation();
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      // Bounce-up delight animation when item is added (sequential async)
      (async () => {
        await controls.start({ scale: 1.35, rotate: -8, transition: { duration: 0.12, ease: 'easeOut' } });
        await controls.start({ scale: 0.9, rotate: 6, transition: { duration: 0.1 } });
        await controls.start({ scale: 1.1, rotate: -3, transition: { duration: 0.1 } });
        await controls.start({ scale: 1, rotate: 0, transition: { duration: 0.15, ease: 'easeInOut' } });
      })();
    }
    prevCount.current = cartCount;
  }, [cartCount, controls]);

  const img = cartCount > 0 ? '/baby/cart_with_item.jpg' : '/baby/cart_empty.jpg';
  const label = cartCount > 0 ? 'Basket full!' : 'Waiting for Mama…';

  return (
    <motion.div animate={controls} className="relative">
      <div
        className={`w-9 h-9 rounded-full overflow-hidden border-2 shadow-sm transition-all duration-200 ${
          isActive
            ? 'border-emerald-500 shadow-emerald-200 ring-2 ring-emerald-300/50'
            : cartCount > 0
              ? 'border-emerald-300'
              : 'border-gray-200'
        }`}
      >
        <img
          src={img}
          alt={label}
          className="w-full h-full object-cover object-top"
        />
      </div>
      {/* Count badge */}
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1.5 bg-emerald-600 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow border border-white">
          {cartCount > 9 ? '9+' : cartCount}
        </span>
      )}
    </motion.div>
  );
};

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    activePillBg: 'bg-emerald-100',
    activeTextColor: 'text-emerald-800',
    renderIcon: (isActive) =>
      isActive ? (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-800" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5L2.5 10.5h2.5v10h4.5v-5.5h5v5.5h4.5v-10h2.5L12 2.5z" />
        </svg>
      ) : (
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
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9.5" className="fill-emerald-800" />
          <polygon points="12,5.5 14.5,12 12,10.5 9.5,12" className="fill-white" />
          <polygon points="12,18.5 14.5,12 12,13.5 9.5,12" className="fill-emerald-300" />
          <circle cx="12" cy="12" r="1.5" className="fill-emerald-950" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-gray-400 fill-none stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="none" />
        </svg>
      ),
  },
  {
    path: '/cart',
    label: 'Bag',
    activePillBg: 'bg-transparent',
    activeTextColor: 'text-emerald-800',
    // Baby icon rendered separately in the nav loop — renderIcon not used for cart
    renderIcon: (_isActive) => null,
  },
  {
    path: '/favorites',
    label: 'Favorites',
    activePillBg: '',
    activeTextColor: 'text-rose-500',
    renderIcon: (isActive) =>
      isActive ? (
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
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="7" r="4.2" className="fill-emerald-800" />
          <path d="M4 20.5v-1.5a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1.5H4z" className="fill-emerald-800" />
        </svg>
      ) : (
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
              {/* Cart tab: baby mascot icon */}
              {item.path === '/cart' ? (
                <BabyCartIcon isActive={isActive} cartCount={cartItemsCount} />
              ) : (
                /* All other tabs: standard circular pill icon */
                <div
                  className={`relative flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? `w-8 h-8 rounded-full ${activePillBg} shadow-2xs`
                      : 'w-8 h-8 rounded-full bg-transparent'
                  }`}
                >
                  {item.renderIcon(isActive)}
                </div>
              )}

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
