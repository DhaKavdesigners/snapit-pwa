import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const placeholders = [
  "Search 'Fresh farm tomatoes' 🍅",
  "Search 'Ambur chicken dum biryani' 🍗",
  "Search 'Nandini fresh milk & curd' 🥛",
  "Search 'Crispy shawarma & burgers' 🍔",
  "Search 'Fortune oil, atta, groceries' 🛒",
  "Search 'Chilled drinks & juices' 🧃",
];

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  const [idx, setIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Rotate placeholder only when not focused and no text typed
  useEffect(() => {
    if (isFocused || value.length > 0) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isFocused, value]);

  // Whether to show the animated placeholder overlay
  const showAnimatedPlaceholder = !isFocused && value.length === 0;

  return (
    <div className="relative mb-4">
      {/* Search icon */}
      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none z-10">
        <Search className="h-4.5 w-4.5 text-gray-400" />
      </div>

      {/* Real input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        // Keep native placeholder invisible — we overlay animated one
        placeholder=""
        className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand shadow-sm transition-all"
      />

      {/* Animated rotating placeholder (only visible when empty and unfocused) */}
      <div
        className={`absolute inset-y-0 left-10 flex items-center pointer-events-none overflow-hidden transition-opacity duration-150 ${showAnimatedPlaceholder ? 'opacity-100' : 'opacity-0'}`}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={prefersReducedMotion ? { opacity: 0 } : { y: 12, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: -12, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="text-gray-400 text-sm whitespace-nowrap"
          >
            {placeholders[idx]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Clear button */}
      {value.length > 0 && (
        <button
          onMouseDown={(e) => { e.preventDefault(); onChange(''); }}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
