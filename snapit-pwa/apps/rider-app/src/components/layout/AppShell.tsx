'use client';

import React, { ReactNode } from 'react';
import { useRider } from '@/context/RiderContext';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { TestModePanel } from '@/components/dev/TestModePanel';

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
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start md:py-6 selection:bg-primary-container selection:text-on-primary-container">
      {/* Phone container wrapper */}
      <div
        className={`w-full max-w-md min-h-[852px] bg-background relative flex flex-col transition-all duration-300 ${
          desktopFrame
            ? 'md:rounded-[36px] md:shadow-2xl md:border-[8px] md:border-slate-800 md:my-4 md:overflow-hidden md:h-[884px]'
            : 'md:rounded-[28px] md:shadow-xl md:border md:border-outline-variant/30 md:overflow-hidden'
        }`}
      >
        {/* Speaker / Dynamic Island pill in desktop framed mode */}
        {desktopFrame && (
          <div className="hidden md:flex justify-center pt-2 pb-1 bg-transparent absolute top-0 left-0 right-0 z-50 pointer-events-none">
            <div className="w-24 h-4 bg-slate-900 rounded-full shadow-inner flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60"></div>
            </div>
          </div>
        )}

        {/* Top App Header */}
        {showHeader && <TopHeader showBack={showBack} title={title} subtitle={subtitle} />}

        {/* Main Content Area */}
        <main
          className={`flex-1 flex flex-col relative ${
            showHeader ? 'pt-16' : ''
          } ${showNav ? 'pb-24' : 'pb-6'} ${noPadding ? '' : 'px-4'}`}
        >
          {children}
        </main>

        {/* Bottom App Navigation */}
        {showNav && <BottomNav />}

        {/* Developer Test Mode Panel (Dev Mode Only) */}
        {process.env.NODE_ENV === 'development' && <TestModePanel />}
      </div>
    </div>
  );
};
