import React from 'react';
import { MapPin, User, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const TopBar: React.FC = () => {
  const { isLoggedIn, userLandmark, userProfile } = useAuthStore();

  // Extract first name for greeting
  const firstName = userProfile?.name?.trim()
    ? userProfile.name.trim().split(/\s+/)[0]
    : 'User';

  // Dynamic time-based greeting (e.g. Good evening, Vishva 👋)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good morning, ${firstName} 👋`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName} 👋`;
    if (hour >= 17 && hour < 22) return `Good evening, ${firstName} 👋`;
    return `Hey ${firstName}! 👋`;
  };

  // Extract Area only (from addressLine2 / Area box or userLandmark)
  const rawArea = userProfile?.addressLine2?.trim() || userLandmark?.trim() || 'Bowrilalpet';
  let areaLine1 = rawArea;
  let areaLine2 = 'KGF';

  if (rawArea.toLowerCase().endsWith(', kgf') || rawArea.toLowerCase().endsWith(' kgf')) {
    areaLine1 = rawArea.replace(/,?\s*kgf$/i, '').trim();
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] px-4 pt-3 pb-2.5 flex flex-col gap-2">
      {/* Top Row: SnapIt Brand + KGF Badge (Left) | User Action (Right) */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: SnapIt Brand + KGF Hub Badge */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img
            src="/images/snapit_logo.png"
            alt="SnapIt"
            className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xl tracking-tight text-gray-900 leading-none">
              Snap<span className="text-emerald-600">It</span>
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-black text-[10px] px-2 py-0.5 rounded-lg tracking-wider uppercase shadow-2xs">
              KGF
            </span>
          </div>
        </Link>

        {/* Right: Before Sign In (Knoc Knoc..) vs After Sign In (hi Vishva 👤) */}
        {isLoggedIn ? (
          <Link
            to="/profile"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity active:scale-95 group shrink-0"
            aria-label="My Account"
          >
            <div className="text-right">
              <span className="block text-xs font-black text-gray-900 leading-tight">
                hi {firstName}
              </span>
              <span className="block text-[10px] font-bold text-emerald-600 leading-tight">
                My Profile
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs ring-2 ring-emerald-100 group-hover:ring-emerald-300 transition-all relative">
              <User className="w-4 h-4 fill-white" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1.5 ring-white" />
            </div>
          </Link>
        ) : (
          <Link
            to="/profile"
            className="text-right hover:text-emerald-700 transition-all active:scale-95 group shrink-0"
            aria-label="Sign In / Register"
          >
            <div className="font-black text-xs sm:text-sm text-gray-900 group-hover:text-emerald-700 leading-tight flex items-center justify-end gap-1">
              <span>Knoc Knoc..</span>
            </div>
            <div className="font-extrabold text-[11px] text-emerald-700 leading-tight">
              Who is this? <span className="font-black">➔</span>
            </div>
          </Link>
        )}
      </div>

      {/* Second Row: Location Area + Welcoming Micro-Section */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Left: Location Pin & Area */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-black text-gray-900 truncate">
                {areaLine1}{areaLine1.endsWith(',') ? '' : ','}
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 tracking-wide uppercase">
                {areaLine2} • 10 MINS
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>Delivering fresh food &amp; groceries in 10 mins</span>
          </div>
        )}

        {/* Right: Welcoming Micro-Greeting (Dynamic) */}
        {isLoggedIn && (
          <div className="hidden sm:flex flex-col text-right shrink-0">
            <span className="text-[11px] font-black text-gray-800 leading-tight">
              {getGreeting()}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 leading-tight">
              What are we getting today?
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
