/**
 * SlideToAccept.tsx — Framer Motion drag gesture for order acceptance
 *
 * Prevents accidental pocket-taps while riding.
 * Rider must drag the thumb 75%+ across the track to confirm acceptance.
 * Spring physics return the thumb if released early.
 */

import { useRef, useState } from 'react';

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface SlideToAcceptProps {
  onAccept: () => void;
  disabled?: boolean;
  label?: string;
  sublabel?: string;
}

const THUMB_WIDTH = 56; // px
const ACCEPTANCE_THRESHOLD = 0.72; // 72% of track

export function SlideToAccept({
  onAccept,
  disabled = false,
  label = 'Slide to Accept',
  sublabel,
}: SlideToAcceptProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [accepted, setAccepted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track width derived at drag time
  const trackWidth = useRef(0);

  // Background fill tracks thumb position
  const fillWidth = useTransform(x, (v) => {
    const tw = trackWidth.current || 300;
    return Math.min(v + THUMB_WIDTH, tw);
  });

  // Label opacity fades as thumb advances
  const labelOpacity = useTransform(x, [0, 80], [1, 0]);

  const handleDragStart = () => {
    setIsDragging(true);
    trackWidth.current = (trackRef.current?.offsetWidth ?? 300) - THUMB_WIDTH - 8;
  };

  const handleDrag = (_: PointerEvent, info: PanInfo) => {
    // Clamp to track bounds
    const max = trackWidth.current;
    const clamped = Math.max(0, Math.min(info.offset.x, max));
    x.set(clamped);
  };

  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const tw = trackWidth.current || 300;
    const progress = info.offset.x / tw;

    if (progress >= ACCEPTANCE_THRESHOLD && !disabled) {
      // Snap to end
      animate(x, tw, { duration: 0.15, ease: 'easeOut' });
      setAccepted(true);
      setTimeout(() => {
        onAccept();
      }, 300);
    } else {
      // Spring back
      animate(x, 0, {
        type: 'spring',
        stiffness: 400,
        damping: 30,
      });
    }
  };

  if (accepted) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative h-14 bg-emerald-500 rounded-2xl flex items-center justify-center gap-2"
      >
        <CheckCircle size={20} className="text-white" />
        <span className="text-white font-semibold text-sm">Order Accepted!</span>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1.5">
      {sublabel && (
        <p className="text-center text-xs text-slate-500 font-medium">{sublabel}</p>
      )}
      <div
        ref={trackRef}
        className="relative h-14 bg-emerald-50 border-2 border-emerald-200 rounded-2xl overflow-hidden select-none"
        style={{ cursor: disabled ? 'not-allowed' : 'default' }}
      >
        {/* Animated fill bar */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 bg-emerald-100 rounded-2xl"
          style={{ width: fillWidth }}
        />

        {/* Track label */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: labelOpacity }}
        >
          <span className="text-emerald-600 font-semibold text-sm tracking-wide">
            {label} →
          </span>
        </motion.div>

        {/* Draggable thumb */}
        <motion.div
          drag={disabled ? false : 'x'}
          dragMomentum={false}
          dragElastic={0}
          style={{ x, left: 4, top: 4 }}
          className={`
            absolute w-12 h-12 rounded-xl
            flex items-center justify-center
            shadow-lg z-10 touch-none
            ${isDragging ? 'scale-95' : 'scale-100'}
            ${disabled ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 cursor-grab active:cursor-grabbing'}
            transition-transform duration-100
          `}
          whileTap={{ scale: 0.95 }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          <span className="text-xl select-none">🛵</span>
        </motion.div>
      </div>
    </div>
  );
}
