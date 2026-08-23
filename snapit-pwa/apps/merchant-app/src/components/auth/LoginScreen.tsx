import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ArrowRight, Store, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-emerald-400 selection:text-slate-950">
      {/* 🌌 Static Luminous Aurora Backdrop (No Animation) */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-gradient-to-tr from-emerald-500/25 via-teal-500/20 to-cyan-400/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] bg-gradient-to-bl from-amber-500/15 via-rose-500/10 to-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-36 left-1/4 w-[560px] h-[560px] bg-gradient-to-t from-indigo-600/25 via-teal-700/15 to-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Static Radial Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf815_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(16,185,129,0.06),transparent_80%)] pointer-events-none" />

      <div className="w-full max-w-sm z-10 my-auto">
        {/* ⭕ Static Circular 3D Brand Emblem & Header */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center mb-3.5 group">
            {/* Static Ambient Multi-Color Halo */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 rounded-full blur-md opacity-75" />
            <div className="relative w-18 h-18 rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 ring-2 ring-white/30 shadow-2xl flex items-center justify-center text-emerald-400">
              <Store className="w-9 h-9 stroke-[2.2] drop-shadow-[0_4px_12px_rgba(52,211,153,0.6)] text-emerald-400" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans drop-shadow-md">
              SnapIt
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 px-2.5 py-0.5 rounded-full font-mono shadow-md shadow-emerald-500/25">
              MERCHANT OS
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            KGF Hyperlocal Dark Store & Partner Counter
          </p>
        </div>

        {/* 🧊 Frosted Glass Card with Iridescent Top Accent */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Static Top Ambient Glow Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Merchant User ID */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                Merchant User ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter Merchant User ID"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/25 rounded-2xl text-sm font-semibold text-white placeholder:text-slate-500 transition-all outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                Store Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-white/10 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/25 rounded-2xl text-sm font-semibold text-white placeholder:text-slate-500 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Glowing Neon Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-12 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.98] text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm tracking-wide cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Open Store Counter</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Minimal Clean Footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SnapIt Secure Counter OS &bull; KGF Region</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
