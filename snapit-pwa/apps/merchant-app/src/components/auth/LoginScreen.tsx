import React, { useState } from 'react';
import { Store, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';
import { mockMerchants } from '../../lib/mockData';

export const LoginScreen: React.FC = () => {
  const login = useMerchantStore((state) => state.login);
  const [userId, setUserId] = useState('m_albaik');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setErrorMessage('Please enter your Merchant ID or Store Name');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(userId, password);
    } catch {
      setErrorMessage('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (merchantId: string) => {
    setUserId(merchantId);
    setPassword('snapit2026');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-brand-100">
      {/* Background Decor */}
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src="/images/snapit_logo.png"
              alt="SnapIt"
              className="h-16 w-auto object-contain drop-shadow-md"
              onError={(e) => {
                // Fallback if image not rendered
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">SnapIt</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              MERCHANT OS
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            KGF Hyperlocal Dark Store & Merchant Counter Operating System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Store Partner Login</h2>
            <p className="text-xs text-slate-600 mt-1">
              Sign in to manage your live counter, accept orders, and control menu stock.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* User ID Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Merchant / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. m_albaik or Al Baik"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm font-medium text-slate-900 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter store password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm font-medium text-slate-900 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Open Store Counter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Store Logins */}
          <div className="mt-7 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              <Store className="w-3.5 h-3.5 text-slate-600" />
              <span>Select Demo KGF Store:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {mockMerchants.map((m) => (
                <button
                  key={m.uid}
                  type="button"
                  onClick={() => handleQuickSelect(m.uid)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    userId === m.uid
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-semibold truncate">{m.storeName}</span>
                  <span className="text-[10px] text-slate-600 font-mono mt-0.5">{m.uid}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>SnapIt Secure POS Terminal &bull; KGF Region</span>
        </div>
      </div>
    </div>
  );
};
