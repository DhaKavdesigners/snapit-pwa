/**
 * ProfilePage.tsx — Rider profile, earnings summary, and settings
 */

import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { LogOut, FileText, ChevronRight, Bell, Star, Truck } from 'lucide-react';

import { useRiderStore } from '../stores/riderStore';
import { formatCurrency } from '../lib/mockData';

const KYC_BADGE_COLORS = {
  PENDING:   'bg-slate-100 text-slate-500',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  VERIFIED:  'bg-emerald-100 text-emerald-700',
  REJECTED:  'bg-red-100 text-red-600',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const rider = useRiderStore((s) => s.rider);
  const { logout, isDispatchChimeEnabled, setChimeEnabled } = useRiderStore();
  const dailyCount = rider?.dailyDeliveryCount ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const kycBadge = KYC_BADGE_COLORS[rider?.kycStatus ?? 'PENDING'];

  return (
    <div className="page-container">
      {/* Header gradient */}
      <div className="brand-gradient px-4 pt-14 pb-16">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl shadow-lg">
            🛵
          </div>
          <div>
            <h1 className="text-white font-extrabold text-xl leading-tight">{rider?.name ?? 'Rider'}</h1>
            <p className="text-emerald-200 text-sm font-medium mt-0.5">{rider?.phone ?? '+91 —'}</p>
            <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 ${kycBadge}`}>
              {rider?.kycStatus ?? 'PENDING'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 grid grid-cols-3 divide-x divide-slate-100"
        >
          <div className="text-center pr-4">
            <p className="text-emerald-600 font-extrabold text-2xl">{dailyCount}</p>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Today</p>
          </div>
          <div className="text-center px-4">
            <p className="text-emerald-600 font-extrabold text-2xl">
              {formatCurrency(Math.floor(dailyCount * 42))}
            </p>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Earned</p>
          </div>
          <div className="text-center pl-4">
            <p className="text-emerald-600 font-extrabold text-2xl">4.9</p>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Rating ⭐</p>
          </div>
        </motion.div>

        {/* Vehicle info */}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Truck size={18} className="text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-slate-700 font-bold text-sm">Vehicle</p>
            <p className="text-slate-500 text-xs font-medium">
              {rider?.vehicleNumber ?? 'Not registered'}
            </p>
          </div>
        </div>

        {/* UPI ID */}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <span className="text-lg">💳</span>
          </div>
          <div className="flex-1">
            <p className="text-slate-700 font-bold text-sm">UPI ID</p>
            <p className="text-slate-500 text-xs font-medium">
              {rider?.upiId ?? 'Not set'}
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="card overflow-hidden divide-y divide-slate-50">
          {/* Chime toggle */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={17} className="text-slate-400" />
              <p className="text-slate-700 font-semibold text-sm">Dispatch Chimes</p>
            </div>
            <motion.button
              id="profile-chime-toggle"
              onClick={() => setChimeEnabled(!isDispatchChimeEnabled)}
              animate={{ backgroundColor: isDispatchChimeEnabled ? '#059669' : '#E2E8F0' }}
              transition={{ duration: 0.3 }}
              className="relative w-12 h-6 rounded-full flex-shrink-0"
            >
              <motion.div
                animate={{ x: isDispatchChimeEnabled ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
              />
            </motion.button>
          </div>

          {/* KYC */}
          <button
            id="goto-kyc-btn"
            onClick={() => navigate('/kyc')}
            className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
          >
            <FileText size={17} className="text-slate-400" />
            <div className="flex-1">
              <p className="text-slate-700 font-semibold text-sm">KYC Documents</p>
              <p className="text-slate-400 text-xs font-medium">
                {rider?.kycStatus === 'VERIFIED' ? '✅ Verified' : 'Tap to upload documents'}
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </button>

          {/* Rating */}
          <div className="px-4 py-3.5 flex items-center gap-3">
            <Star size={17} className="text-amber-400" />
            <div className="flex-1">
              <p className="text-slate-700 font-semibold text-sm">Your Rating</p>
              <p className="text-slate-400 text-xs font-medium">Based on customer feedback</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-500 font-bold text-sm">4.9</span>
              <span className="text-slate-300 text-xs">/ 5.0</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="w-full h-13 bg-red-50 border border-red-100 text-red-600 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors py-3.5"
        >
          <LogOut size={16} /> Sign Out
        </button>

        <p className="text-center text-slate-400 text-xs pb-4">
          SnapIt Rider v0.1.0 · Dhakav Designers · KGF
        </p>
      </div>
    </div>
  );
}
