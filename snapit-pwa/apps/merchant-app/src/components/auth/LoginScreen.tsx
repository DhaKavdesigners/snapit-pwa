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
      setErrorMessage('Please enter your Merchant User ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your store password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(userId, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your ID and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* 🌌 Soft Ambient Backdrop Blurs */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-emerald-300/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] bg-teal-300/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-36 left-1/4 w-[500px] h-[500px] bg-emerald-200/25 rounded-full blur-[110px] pointer-events-none" />

      {/* Subtle Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#05966912_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-md z-10 my-auto">
        {/* ⭕ Minnit Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative inline-flex flex-col items-center justify-center group">
            {/* Glowing Ambient Halo */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/30 via-teal-400/25 to-emerald-400/30 rounded-3xl blur-2xl animate-pulse" />
            
            {/* White Emblem Container with Large Logo */}
            <div className="relative px-7 py-4 rounded-3xl bg-white border border-emerald-100/90 shadow-[0_12px_35px_rgba(5,150,105,0.14)] flex items-center justify-center transition-transform group-hover:scale-[1.02] duration-300">
              <img
                src="/images/logo_with_tag.png"
                alt="Minnit - Everything You Need in Minutes"
                className="h-16 sm:h-20 w-auto object-contain drop-shadow-xs"
              />
            </div>
          </div>

          {/* Prominent Minnit Typography & Merchant OS Tag */}
          <div className="flex items-center justify-center gap-2.5 mt-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-sans">
              Minnit
            </h1>
            <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3 py-1 rounded-full font-mono shadow-xs">
              MERCHANT OS
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1.5">
            Everything You Need in Minutes &bull; Partner Counter Terminal
          </p>
        </div>

        {/* 🧊 Crisp Elevated Glass Card */}
        <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-7 sm:p-8 shadow-[0_25px_60px_rgba(15,23,42,0.09)] relative overflow-hidden">
          {/* Top Emerald Gradient Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 animate-ping" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {/* Merchant User ID */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Merchant User ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter Merchant User ID"
                  className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Store Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full pl-10 pr-11 py-3 sm:py-3.5 bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-12 sm:h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-black rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 text-sm sm:text-base tracking-wide cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Open Store Counter</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Clean Footer */}
        <div className="mt-6 sm:mt-7 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Minnit Secure Counter Terminal &bull; KGF Region</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
