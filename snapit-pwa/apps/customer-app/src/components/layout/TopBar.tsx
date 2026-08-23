import React, { useState, useEffect } from 'react';
import { MapPin, User, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const WELCOME_PROMPTS = [
  "What are we getting today?",
  "Our KGF essentials in 10 mins ",
  "Fresh fruits, veggies & more ",
  "Cravings sorted in a snap ",
  "Farm-fresh produce at your door ",
  "Snacks, drinks & daily needs ",
  "Everything you need, right here ",
  "Ready when you are ",
];

export const TopBar: React.FC = () => {
  const { isLoggedIn, userLandmark, userProfile } = useAuthStore();
  const [welcomePrompt, setWelcomePrompt] = useState(WELCOME_PROMPTS[0]);

  // Session-consistent dynamic prompt (changes on new session/login)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('snapit_session_prompt');
      if (stored) {
        setWelcomePrompt(stored);
      } else {
        const randomChoice = WELCOME_PROMPTS[Math.floor(Math.random() * WELCOME_PROMPTS.length)];
        sessionStorage.setItem('snapit_session_prompt', randomChoice);
        setWelcomePrompt(randomChoice);
      }
    } catch {
      // Fallback
      setWelcomePrompt(WELCOME_PROMPTS[0]);
    }
  }, [isLoggedIn]);

  // Extract first name for single greeting
  const firstName = userProfile?.name?.trim()
    ? userProfile.name.trim().split(/\s+/)[0]
    : 'User';

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good morning, ${firstName} `;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName} `;
    if (hour >= 17 && hour < 22) return `Good evening, ${firstName} `;
    return `Hey ${firstName}! `;
  };

  // Extract Area only (from addressLine2 / Area box or userLandmark)
  const rawArea = userProfile?.addressLine2?.trim() || userLandmark?.trim() || 'Bowrilalpet';
  let areaLine1 = rawArea;
  let areaLine2 = 'KGF';

  if (rawArea.toLowerCase().endsWith(', kgf') || rawArea.toLowerCase().endsWith(' kgf')) {
    areaLine1 = rawArea.replace(/,?\s*kgf$/i, '').trim();
  }

  return (
    <header className="sticky top-0 z-40 bg-white px-5 pt-4 pb-2.5 flex items-center justify-between gap-3">
      {/* Left: SnapIt Brand + Round Logo + KGF */}
      <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
        <div className="w-10 h-10 rounded-full bg-emerald-50/70 border border-emerald-200/60 p-1 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
          <img
            src="/images/snapit_logo.png"
            alt="SnapIt"
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-2xl tracking-tight text-gray-900 leading-none">
            Snap<span className="text-emerald-500">It</span>
          </span>
          <span className="text-sm font-black text-emerald-600 tracking-wider">
            KGF
          </span>
        </div>
      </Link>

      {/* Right: Welcoming Greeting + Inset Profile Avatar */}
      {isLoggedIn ? (
        <Link
          to="/profile"
          className="flex items-center gap-3 hover:opacity-85 transition-opacity active:scale-95 group shrink-0 pr-1"
          aria-label="My Profile"
        >
          <div className="flex flex-col text-right leading-tight">
            <span className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-emerald-700 transition-colors whitespace-nowrap">
              {getGreeting()}
            </span>
            <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">
              {welcomePrompt}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs ring-2 ring-emerald-100 group-hover:ring-emerald-300 transition-all relative shrink-0">
            <User className="w-4.5 h-4.5 fill-white" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
        </Link>
      ) : (
        <Link
          to="/profile"
          className="flex items-center gap-2.5 hover:text-emerald-700 transition-all active:scale-95 group shrink-0 pr-1"
          aria-label="Sign In / Register"
        >
          <div className="flex flex-col text-right leading-tight">
            <span className="font-black text-xs sm:text-sm text-gray-900 group-hover:text-emerald-700 transition-colors">
              Knoc Knoc..
            </span>
            <span className="font-extrabold text-[11px] text-emerald-700">
              Who is this? ➔
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-emerald-100 text-gray-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shadow-2xs shrink-0">
            <User className="w-4.5 h-4.5" />
          </div>
        </Link>
      )}
    </header>
  );
};
