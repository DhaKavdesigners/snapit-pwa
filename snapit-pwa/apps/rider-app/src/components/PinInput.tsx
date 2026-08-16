/**
 * PinInput.tsx — 4-digit secure handshake PIN input
 *
 * Custom numeric keypad (no native keyboard) for riding-safe interaction.
 * - Large 56px+ touch targets
 * - Shake animation on wrong PIN
 * - Uses playErrorPing() on incorrect attempts
 */

import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';
import { playErrorPing } from '../lib/audio';

interface PinInputProps {
  /** Called with the entered PIN string when all 4 digits are filled */
  onComplete: (pin: string) => void;
  /** Set true to show shake + red state for a bad PIN attempt */
  hasError?: boolean;
  /** Reset error state when user starts typing again */
  onReset?: () => void;
  isLoading?: boolean;
}

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export function PinInput({ onComplete, hasError = false, onReset, isLoading }: PinInputProps) {
  const [digits, setDigits] = useState<string[]>([]);

  const handleKey = (key: string) => {
    if (isLoading) return;

    if (key === '⌫') {
      if (digits.length === 0) return;
      setDigits((prev) => prev.slice(0, -1));
      onReset?.();
      return;
    }

    if (key === '') return;

    // Reset error on new input
    if (hasError) onReset?.();

    const next = [...digits, key].slice(0, 4);
    setDigits(next);

    if (next.length === 4) {
      onComplete(next.join(''));
    }
  };

  const handleErrorShake = () => {
    if (hasError) {
      playErrorPing();
      setDigits([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* PIN display cells */}
      <motion.div
        className="flex gap-3 justify-center"
        animate={hasError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        onAnimationComplete={handleErrorShake}
      >
        {[0, 1, 2, 3].map((i) => {
          const filled = i < digits.length;
          const isError = hasError;
          return (
            <motion.div
              key={i}
              animate={{
                scale: filled ? [1, 1.1, 1] : 1,
                borderColor: isError
                  ? '#EF4444'
                  : filled
                  ? '#059669'
                  : '#E2E8F0',
                backgroundColor: isError
                  ? '#FEF2F2'
                  : filled
                  ? '#ECFDF5'
                  : '#F8FAFC',
              }}
              transition={{ duration: 0.15 }}
              className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                {filled && (
                  <motion.div
                    key={`dot-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                    className={`w-3 h-3 rounded-full ${isError ? 'bg-red-400' : 'bg-emerald-600'}`}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-center text-red-500 text-sm font-medium"
          >
            ❌ Incorrect PIN. Ask the customer again.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Custom Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
        {KEYPAD.flat().map((key, idx) => {
          if (key === '') {
            return <div key={idx} aria-hidden="true" />;
          }

          const isBackspace = key === '⌫';
          const isDisabled = isLoading || (digits.length >= 4 && !isBackspace);

          return (
            <motion.button
              key={idx}
              id={`pin-key-${key === '⌫' ? 'backspace' : key}`}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleKey(key)}
              disabled={isDisabled}
              className={`
                h-14 rounded-2xl font-semibold text-xl flex items-center justify-center
                transition-colors duration-150 select-none touch-none
                ${isBackspace
                  ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  : 'bg-white border border-slate-200 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 shadow-card'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {isBackspace ? <Delete size={18} /> : key}
            </motion.button>
          );
        })}
      </div>

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <span className="text-emerald-700 text-sm font-medium">Verifying PIN…</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
