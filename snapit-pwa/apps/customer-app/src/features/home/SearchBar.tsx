import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const placeholders = [
  "Search milk...",
  "Search biryani...",
  "Search flowers...",
  "Search fresh bread..."
];

export const SearchBar: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-text-secondary" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl leading-5 bg-surface text-text-primary placeholder-transparent focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm"
        placeholder="Search" // fallback
      />
      <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none overflow-hidden h-full pr-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={prefersReducedMotion ? { opacity: 0 } : { y: 15, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: -15, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="text-text-secondary text-sm whitespace-nowrap"
          >
            {placeholders[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};
