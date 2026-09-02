'use client';

import React, { ReactNode } from 'react';
import { useRider } from '@/context/RiderContext';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { DevTestingToggle } from '@/components/dev/DevTestingToggle';

interface AppShellProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  showBack?: boolean;
  title?: string;
  subtitle?: string;
  noPadding?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showHeader = true,
  showNav = true,
  showBack = false,
  title,
  subtitle,
  noPadding = false,
}) => {
  const { desktopFrame } = useRider();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile container - perfectly centered with no horizontal shift or clipping */}
      <div
        className={`w-full max-w-md min-h-screen bg-white relative flex flex-col shadow-xl border-x border-slate-200/80 ${
          desktopFrame
            ? 'md:rounded-[36px] md:shadow-2xl md:border-[8px] md:border-slate-800 md:my-4 md:overflow-hidden md:h-[884px]'
            : ''
        }`}
      >
        {/* Top App Header */}
        {showHeader && <TopHeader showBack={showBack} title={title} subtitle={subtitle} />}

        {/* Main Content Area */}
        <main
          className={`flex-1 flex flex-col w-full relative ${
            showHeader ? 'pt-16' : ''
          } ${showNav ? 'pb-24' : 'pb-6'} ${noPadding ? '' : 'px-4'}`}
        >
          {children}
        </main>

        {/* Bottom App Navigation */}
        {showNav && <BottomNav />}

        {/* Temporary Developer Testing Controls */}
        <DevTestingToggle />
      </div>
    </div>
  );
};
