import React from 'react';
import { UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TopBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <img src="/images/snapit_logo.png" alt="SnapIt Logo" className="h-10 w-auto object-contain" />
      </Link>
      
      <button 
        className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface transition-colors"
        aria-label="User Profile"
      >
        <UserCircle2 className="h-7 w-7 text-text-secondary" />
      </button>
    </header>
  );
};
