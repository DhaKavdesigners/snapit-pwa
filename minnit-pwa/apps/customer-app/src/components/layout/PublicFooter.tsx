import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Mail, Phone, MapPin, ExternalLink, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 pt-8 pb-24 border-t border-slate-800 mt-8 select-none">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Top brand header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-sm">
              <img 
                src="/icons/icon-192x192.png" 
                alt="Minnit" 
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">Minnit</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  KGF Express
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Operated by <strong className="text-white">Dhakav Designers</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Razorpay Verified Payment Gateway</span>
          </div>
        </div>

        {/* Business details & registered address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-800 text-xs">
          <div>
            <h4 className="font-black text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Registered Office &amp; Entity Details
            </h4>
            <p className="text-slate-300 leading-relaxed font-normal">
              <strong className="text-white">Dhakav Designers (Minnit)</strong><br />
              #48, Tailor Shop Line, Oorgaum,<br />
              Kolar Gold Fields (KGF), Karnataka - 563120, India
            </p>
          </div>

          <div>
            <h4 className="font-black text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Customer Support &amp; Grievance
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href="mailto:contact.minnit@gmail.com" className="hover:text-emerald-400 transition-colors">
                  contact.minnit@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href="tel:+918217649688" className="hover:text-emerald-400 transition-colors font-mono">
                  +91 82176 49688
                </a>
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                Hours: Mon – Sun: 7:00 AM – 11:00 PM IST
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Policy Links for Razorpay Compliance */}
        <div className="py-6 border-b border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Legal &amp; Compliance Policies
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
            <Link 
              to="/terms" 
              className="text-slate-300 hover:text-emerald-400 transition-colors py-1 inline-flex items-center gap-1 underline underline-offset-4 decoration-slate-700 hover:decoration-emerald-400"
            >
              Terms of Service
            </Link>
            <span className="text-slate-600">•</span>
            <Link 
              to="/privacy" 
              className="text-slate-300 hover:text-emerald-400 transition-colors py-1 inline-flex items-center gap-1 underline underline-offset-4 decoration-slate-700 hover:decoration-emerald-400"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-600">•</span>
            <Link 
              to="/refund-policy" 
              className="text-slate-300 hover:text-emerald-400 transition-colors py-1 inline-flex items-center gap-1 underline underline-offset-4 decoration-slate-700 hover:decoration-emerald-400"
            >
              Refund &amp; Cancellation
            </Link>
            <span className="text-slate-600">•</span>
            <Link 
              to="/shipping-policy" 
              className="text-slate-300 hover:text-emerald-400 transition-colors py-1 inline-flex items-center gap-1 underline underline-offset-4 decoration-slate-700 hover:decoration-emerald-400"
            >
              Shipping &amp; Delivery
            </Link>
            <span className="text-slate-600">•</span>
            <Link 
              to="/contact" 
              className="text-slate-300 hover:text-emerald-400 transition-colors py-1 inline-flex items-center gap-1 underline underline-offset-4 decoration-slate-700 hover:decoration-emerald-400"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Bottom copyright and compliance notes */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>
            © {new Date().getFullYear()} <strong className="text-slate-300">Dhakav Designers (Minnit)</strong>. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-slate-400">
            <span>Instant 10–30 min delivery across KGF</span>
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
          </p>
        </div>

      </div>
    </footer>
  );
};
