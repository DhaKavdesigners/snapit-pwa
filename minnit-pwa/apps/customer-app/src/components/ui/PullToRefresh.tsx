import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const currentY = e.touches[0].clientY;
    if (currentY > startY) {
      // Prevent default scrolling when pulling down at the top
      if (document.documentElement.scrollTop === 0) {
        if (e.cancelable) e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    setPulling(false);
    
    const endY = e.changedTouches[0].clientY;
    if (endY - startY > 100 && window.scrollY === 0) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-screen"
    >
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center bg-background z-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      )}
      <div className={`transition-transform duration-300 ${refreshing ? 'translate-y-16' : 'translate-y-0'}`}>
        {children}
      </div>
    </div>
  );
};
