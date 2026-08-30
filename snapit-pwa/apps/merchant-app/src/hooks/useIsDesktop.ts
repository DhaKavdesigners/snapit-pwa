import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 1024; // Tailwind 'lg' breakpoint

/**
 * Custom hook to detect whether the viewport is desktop/laptop size (>= 1024px).
 * Dynamically updates on window resize with event listener cleanup.
 */
export function useIsDesktop(breakpoint = DESKTOP_BREAKPOINT): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isDesktop;
}
