import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Home, FileText, Lock, RefreshCw, Truck, Phone } from 'lucide-react';
import { PublicFooter } from '../../components/layout/PublicFooter';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  badge: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  badge,
  lastUpdated = 'October 11, 2026',
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on mount / route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
  }, [location.pathname]);

  const navLinks = [
    { path: '/terms', label: 'Terms', icon: FileText },
    { path: '/privacy', label: 'Privacy', icon: Lock },
    { path: '/refund-policy', label: 'Refunds', icon: RefreshCw },
    { path: '/shipping-policy', label: 'Shipping', icon: Truck },
    { path: '/contact', label: 'Contact', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to App</span>
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                M
              </div>
              <span className="font-black text-lg text-slate-900 tracking-tight">Minnit</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified</span>
            </div>
            
            <Link
              to="/"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all uppercase tracking-wider"
            >
              Open App
            </Link>
          </div>
        </div>

        {/* ── Secondary Policy Navigation Tabs ── */}
        <div className="border-t border-slate-100 bg-slate-50/80">
          <div className="max-w-4xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5">
            {navLinks.map((tab) => {
              const isActive = location.pathname === tab.path || 
                (tab.path === '/refund-policy' && location.pathname === '/refunds') ||
                (tab.path === '/shipping-policy' && location.pathname === '/shipping') ||
                (tab.path === '/contact' && location.pathname === '/contact-us');
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Legal Content Canvas ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Document Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              {badge}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Last Updated: {lastUpdated}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
            {title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {subtitle}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Legal Entity: <strong className="text-slate-900 font-bold">Dhakav Designers (Minnit)</strong>
            </span>
            <span>
              Location: <strong className="text-slate-900 font-bold">KGF, Karnataka</strong>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {children}
        </div>
      </main>

      {/* ── Public Footer ── */}
      <PublicFooter />
    </div>
  );
};
