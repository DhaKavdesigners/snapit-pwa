import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Package, MapPin, CreditCard, HelpCircle, LogOut } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="p-6 h-full flex flex-col justify-center max-w-sm mx-auto pb-32">
        <div className="text-center mb-8">
          <h2 className="font-bold text-2xl text-text-primary mb-2">Login to SnapIt</h2>
          <p className="text-text-secondary text-sm">Enter your phone number to proceed</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex bg-surface rounded-2xl overflow-hidden border border-gray-100 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
            <div className="px-4 py-4 flex items-center justify-center bg-gray-50 border-r border-gray-100 text-text-primary font-medium">
              +91
            </div>
            <input 
              type="tel" 
              placeholder="Enter phone number" 
              className="flex-1 px-4 py-4 bg-transparent outline-none text-text-primary font-medium placeholder:text-gray-400"
            />
          </div>
          
          <Button 
            className="w-full h-14 text-lg font-bold shadow-md hover:scale-[1.01] transition-transform" 
            onClick={() => setIsLoggedIn(true)}
          >
            Get OTP
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in user
  return (
    <div className="p-4 pt-4 pb-24 h-full overflow-y-auto bg-gray-50">
      {/* User Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center text-2xl font-bold">
          V
        </div>
        <div>
          <h2 className="font-bold text-xl text-text-primary">Vishva</h2>
          <p className="text-text-secondary text-sm font-medium">+91 98765 43210</p>
        </div>
      </div>
      
      {/* Settings Options */}
      <div className="bg-white rounded-3xl p-2 shadow-sm mb-6">
        <ul className="flex flex-col">
          <li className="flex items-center gap-4 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
            <Package className="h-6 w-6 text-text-secondary" />
            <span className="font-semibold text-text-primary">My Orders</span>
          </li>
          <li className="flex items-center gap-4 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
            <MapPin className="h-6 w-6 text-text-secondary" />
            <span className="font-semibold text-text-primary">Saved Addresses</span>
          </li>
          <li className="flex items-center gap-4 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
            <CreditCard className="h-6 w-6 text-text-secondary" />
            <span className="font-semibold text-text-primary">Payment Methods</span>
          </li>
          <li className="flex items-center gap-4 p-4 active:bg-gray-50 transition-colors cursor-pointer">
            <HelpCircle className="h-6 w-6 text-text-secondary" />
            <span className="font-semibold text-text-primary">Help & Support</span>
          </li>
        </ul>
      </div>
      
      {/* Log Out */}
      <div className="px-2">
        <button 
          onClick={() => setIsLoggedIn(false)}
          className="flex items-center gap-2 text-red-500 font-bold active:opacity-70 transition-opacity p-2"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </div>
  );
};
