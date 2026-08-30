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
      const stored = sessionStorage.getItem('minnit_session_prompt');
      if (stored) {
        setWelcomePrompt(stored);
      } else {
        const randomChoice = WELCOME_PROMPTS[Math.floor(Math.random() * WELCOME_PROMPTS.length)];
        sessionStorage.setItem('minnit_session_prompt', randomChoice);
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
    <header className="sticky top-0 z-40 bg-white px-3 py-2 flex items-center justify-between gap-2">
      {/* Left: Minnit horizontal logo */}
      <Link to="/" className="shrink-0 group">
        <img
          src="/images/minnit_length_logo.png"
          alt="Minnit"
          className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </Link>

      {/* Right: Welcoming Greeting + Profile Avatar */}
      {isLoggedIn ? (
        <Link
          to="/profile"
          className="flex items-center gap-2 hover:opacity-85 transition-opacity active:scale-95 group min-w-0 flex-1 justify-end"
          aria-label="My Profile"
        >
          <div className="flex flex-col text-right leading-tight min-w-0">
            <span className="text-[12px] font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate block">
              {getGreeting()}
            </span>
            <span className="text-[10px] font-medium text-gray-500 truncate block">
              {welcomePrompt}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm ring-2 ring-emerald-100 group-hover:ring-emerald-300 transition-all relative shrink-0">
            <User className="w-4 h-4 fill-white" />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" />
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
