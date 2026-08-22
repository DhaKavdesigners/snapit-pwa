import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useMerchantStore } from '../../store/useMerchantStore';

export const LoginScreen: React.FC = () => {
  const login = useMerchantStore((state) => state.login);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
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
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-brand-100">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src="/images/snapit_logo.png"
              alt="SnapIt"
              className="h-16 w-auto object-contain drop-shadow-md"
              onError={(e) => {
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
              Enter your store credentials to access your live order queue and stock manager.
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
                Merchant ID / Store Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. m_albaik, m_mhetha, or store name"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm font-medium text-slate-900 transition-all outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
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
        </div>

        {/* Security & System Info Footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>SnapIt Secure Merchant Authentication &bull; KGF Region</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
