'use client';

import React, { ReactNode } from 'react';
import { useRider } from '@/context/RiderContext';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  showBack?: boolean;
  title?: string;
  subtitle?: string;
  noPadding?: boolean;
  headerVariant?: 'default' | 'dark';
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showHeader = true,
  showNav = true,
  showBack = false,
  title,
  subtitle,
  noPadding = false,
  headerVariant = 'default',
}) => {
  const { desktopFrame } = useRider();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start">
      <div
        className={`w-full max-w-md min-h-screen bg-slate-50 relative flex flex-col border-x border-slate-200/60 ${
          desktopFrame
            ? 'md:rounded-[36px] md:shadow-2xl md:border-[8px] md:border-slate-800 md:my-4 md:overflow-hidden md:h-[884px]'
            : 'shadow-xl'
        }`}
      >
        {showHeader && (
          <TopHeader
            showBack={showBack}
            title={title}
            subtitle={subtitle}
            variant={headerVariant}
          />
        )}

        <main
          className={`flex-1 flex flex-col w-full relative ${
            showHeader ? 'pt-[60px]' : ''
          } ${showNav ? 'pb-[76px]' : 'pb-6'} ${noPadding ? '' : 'px-4'}`}
        >
          {children}
        </main>

        {showNav && <BottomNav />}
      </div>
    </div>
  );
};
