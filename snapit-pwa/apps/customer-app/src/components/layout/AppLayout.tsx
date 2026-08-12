import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-slate-50 shadow-2xl overflow-x-hidden flex flex-col pb-[140px]">
      <TopBar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

