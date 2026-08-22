import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Package, MapPin, LogOut, CheckCircle2, X, User, ShoppingBag, MessageCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

// ─── Tiny Web Audio sound engine ─────────────────────────────────────────────
const playSound = (type: 'success' | 'tap') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    if (type === 'success') {
      // A sweet two-tone rising chime: C5 → E5 → G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.15 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } else {
      oscillator.type = 'sine';
      oscillator.frequency.value = 600;
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      oscillator.start(); oscillator.stop(ctx.currentTime + 0.08);
    }
  } catch {}
};

type RegistrationStep = 'form' | 'success' | 'dashboard';

export const ProfileView: React.FC = () => {
  const { register, logout, isLoggedIn, userProfile } = useAuthStore();
  const navigate = useNavigate();

  // If already registered, skip straight to dashboard.
  // Populate formData from persisted profile so the dashboard has the right name/phone.
  const [step, setStep] = useState<RegistrationStep>(
    isLoggedIn ? 'dashboard' : 'form'
  );
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    confirmPhone: userProfile?.phone || '',
    addressLine1: userProfile?.addressLine1 || '',
    addressLine2: userProfile?.addressLine2 || '',
    landmark: userProfile?.landmark || '',
    pincode: userProfile?.pincode || ''
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Dashboard modal states
  const [aboutModal, setAboutModal] = useState(false);
  const [policyModal, setPolicyModal] = useState<null | 'privacy' | 'terms' | 'refund'>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'phone' || e.target.name === 'confirmPhone') {
      setPhoneError('');
    }
  };

  const validatePhone = (phone: string) => {
    if (phone.length !== 10) return false;
    if (!/^[6-9]/.test(phone)) return false; // Indian numbers start with 6-9
    if (/^(\d)\1{9}$/.test(phone)) return false; // Prevent 1111111111 etc.
    return true;
  };

  const handleGetVerification = () => {
    if (!validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid Indian mobile number.');
      return;
    }
    if (formData.phone !== formData.confirmPhone) {
      setPhoneError('Phone numbers do not match.');
      return;
    }
    setPhoneError('');
    setShowOtpModal(true);
  };

  const isFormValid = 
    formData.name.trim() !== '' && 
    formData.phone.length === 10 && 
    formData.confirmPhone.length === 10 && 
    formData.addressLine1.trim() !== '' && 
    formData.addressLine2.trim() !== '' &&
    formData.pincode.length === 6;

  const isOtpValid = otp.length === 6;

  const handleOtpConfirm = async () => {
    try {
      // 1. Insert into Supabase
      const { error } = await supabase
        .from('users')
        .insert({
          phone: `+91${formData.phone}`,
          name: formData.name,
          role: 'CUSTOMER',
          is_delivery_verified: false
        });

      // Ignore unique constraint violation if the user is just logging back in
      if (error && error.code !== '23505') { 
        throw error;
      }

      // 2. Persist user to global store → TopBar will immediately show the location
      register(formData);
      setShowOtpModal(false);
      setStep('success');
    } catch (err: any) {
      console.error("Failed to register user to Supabase:", err);
      const errorMessage = err?.message || err?.error_description || "Unknown error";
      alert(`Registration failed: ${errorMessage}\n\nMake sure your .env keys are correct and server is restarted!`);
    }
  };

  const renderForm = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
          <User className="w-8 h-8 text-brand" />
        </div>
        <h2 className="font-black text-2xl text-text-primary mb-1 tracking-tight">Profile Registration</h2>
        <p className="text-text-secondary text-sm">Create your SnapIt account</p>
      </div>

      <div className="space-y-4 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        
        {/* Name */}
        <div>
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Customer Name <span className="text-red-500">*</span></label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-sm" />
        </div>

        {/* Phones */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Phone Number <span className="text-red-500">*</span></label>
            <div className="flex rounded-xl border border-gray-200 focus-within:border-brand focus-within:bg-white focus-within:ring-4 focus-within:ring-brand/10 overflow-hidden transition-all bg-gray-50/50">
              <span className="px-4 py-3.5 bg-gray-100/50 border-r border-gray-200 font-bold text-text-primary text-sm flex items-center">
                🇮🇳 +91
              </span>
              <input type="tel" name="phone" maxLength={10} value={formData.phone} onChange={(e) => { setFormData({...formData, phone: e.target.value.replace(/\D/g, '')}); setPhoneError(''); }} placeholder="10-digit mobile" className="flex-1 px-4 py-3.5 outline-none font-bold tracking-wider text-sm bg-transparent" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Confirm Phone <span className="text-red-500">*</span></label>
            <input type="tel" name="confirmPhone" maxLength={10} value={formData.confirmPhone} onChange={(e) => { setFormData({...formData, confirmPhone: e.target.value.replace(/\D/g, '')}); setPhoneError(''); }} placeholder="Re-enter mobile number" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-bold tracking-wider text-sm" />
          </div>
        </div>

        {phoneError && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs text-red-500 font-bold px-1">
            {phoneError}
          </motion.p>
        )}

        <div className="h-px w-full bg-gray-100 my-2" />

        {/* Address */}
        <div>
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Address Details <span className="text-red-500">*</span></label>
          <div className="space-y-2">
            <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} placeholder="Line 1: House No, Building Name" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-sm" />
            <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} placeholder="Line 2: Area / Street" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Landmark</label>
            <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="Near temple" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">PIN Code <span className="text-red-500">*</span></label>
            <input type="tel" name="pincode" maxLength={6} value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} placeholder="563122" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-bold tracking-widest text-sm text-center" />
          </div>
        </div>

      </div>

      <div className="flex items-center gap-2 mt-2 py-3 px-4 bg-emerald-50/70 text-emerald-700 rounded-xl border border-emerald-100">
        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-semibold">Location access enabled</span>
      </div>

      <p className="text-center text-xs text-text-secondary px-4 mt-6">
        Submit your details to register and verify your profile for instant future orders.
      </p>

      <Button 
        disabled={!isFormValid}
        onClick={handleGetVerification}
        className="w-full h-14 mt-2 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-brand border-0 shadow-[0_8px_20px_rgba(5,150,105,0.30)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.45)] hover:scale-[1.02] transition-all uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
      >
        <ShoppingBag className="w-4 h-4" />
        Verify &amp; Create Account
      </Button>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      onAnimationComplete={() => playSound('success')}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      {/* Animated checkmark ring */}
      <div className="relative w-28 h-28 mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.15, 1] }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
          className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-brand rounded-full flex items-center justify-center shadow-[0_16px_40px_rgba(5,150,105,0.35)]"
        >
          <CheckCircle2 className="w-14 h-14 text-white" />
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
          className="absolute inset-0 bg-brand/30 rounded-full"
        />
      </div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full">
        <h2 className="font-black text-3xl text-text-primary tracking-tight mb-1">Welcome aboard!</h2>
        <p className="text-text-secondary text-sm mb-8 font-medium">Your SnapIt account is all set 🎉</p>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_32px_rgba(5,150,105,0.08)] border border-emerald-100 w-full mb-6 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl -mr-6 -mt-6" />
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3">Account Details</p>
          <p className="font-black text-2xl text-text-primary mb-0.5">{formData.name}</p>
          <p className="font-mono text-sm font-bold text-gray-500 tracking-wider mb-4">+91 {formData.phone}</p>
          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(5,150,105,0.3)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </div>
        </div>

        <button 
          onClick={() => { setStep('dashboard'); navigate('/'); }}
          className="w-full h-14 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-brand shadow-[0_8px_20px_rgba(5,150,105,0.35)] hover:shadow-[0_10px_28px_rgba(5,150,105,0.45)] hover:scale-[1.02] transition-all rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <ShoppingBag className="w-5 h-5" />
          Continue Shopping
        </button>
      </motion.div>
    </motion.div>
  );

  // ─── Policy content ───────────────────────────────────────────────────────
  const policyContent = {
    privacy: {
      title: 'Privacy Policy',
      body: 'SnapIt KGF collects your name, phone number, and delivery address solely to facilitate order delivery. We do not share your data with third parties. Your location is used only for real-time delivery tracking. Data is stored securely and you may request deletion at any time by contacting support.',
    },
    terms: {
      title: 'Terms of Service',
      body: 'By using SnapIt, you agree to place orders only for lawful goods available on the platform. Orders once confirmed cannot be cancelled after preparation begins. SnapIt reserves the right to refuse service to accounts with fraudulent activity. Prices are inclusive of applicable taxes.',
    },
    refund: {
      title: 'Refund Policy',
      body: 'Refunds are processed within 5–7 business days for eligible orders. A refund is applicable if: (1) the wrong item was delivered, (2) the item was damaged upon delivery, or (3) the order was not delivered. Refund requests must be raised within 24 hours of delivery via Help & Support.',
    },
  };

  const renderDashboard = () => {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=059669&color=fff&size=200&font-size=0.4&bold=true`;

    // ── Trust tier — read from persisted profile ─────────────────────────
    const deliveryVerified = userProfile?.deliveryVerified ?? false;
    const orderCount       = userProfile?.completedOrdersCount ?? 0;
    const isTrusted        = deliveryVerified || orderCount >= 1;

    const tiles = [
      {
        icon: Package,
        label: 'My Orders',
        sublabel: 'Track active orders',
        bg: 'bg-emerald-50',
        iconColor: 'text-brand',
        action: () => playSound('tap'),
      },
      {
        icon: MapPin,
        label: 'Saved Addresses',
        sublabel: 'Manage delivery spots',
        bg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        action: () => playSound('tap'),
      },
      {
        icon: MessageCircle,
        label: 'Help & Support',
        sublabel: 'Chat on WhatsApp',
        bg: 'bg-green-50',
        iconColor: 'text-green-600',
        action: () => window.open('https://wa.me/918217649688', '_blank'),
      },
      {
        icon: Info,
        label: 'About SnapIt',
        sublabel: 'App info & version',
        bg: 'bg-gray-50',
        iconColor: 'text-gray-500',
        action: () => setAboutModal(true),
      },
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">

        {/* ── Hero header card ── */}
        <div className="relative overflow-hidden rounded-3xl mb-5 bg-gradient-to-br from-emerald-600 via-brand to-emerald-800 p-5 shadow-[0_12px_40px_rgba(5,150,105,0.35)]">
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 bg-white/5 rounded-full" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg shrink-0" style={{ width: 64, height: 64 }}>
              <img src={avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">Welcome back</p>
              <h2 className="font-black text-xl text-white truncate leading-tight">{formData.name || 'User'}</h2>
              <p className="text-white/60 text-xs font-mono tracking-wider">+91 {formData.phone}</p>
            </div>
            {/* Dynamic trust badge ─ upgrades silently after 1st delivery */}
            {isTrusted ? (
              <div className="shrink-0 bg-amber-400/20 backdrop-blur-md text-amber-200 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-300/40 flex items-center gap-1">
                <span>⭐</span>
                Verified Customer
              </div>
            ) : (
              <div className="shrink-0 bg-white/20 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-medium border border-white/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Phone Verified
              </div>
            )}
          </div>
        </div>

        {/* ── Stats bar: only visible when orderCount > 0 ── */}
        {orderCount > 0 && (
          <div className="bg-white rounded-2xl px-5 py-3 mb-5 shadow-sm border border-gray-100 flex items-center justify-center gap-2">
            <Package className="w-4 h-4 text-brand" />
            <span className="font-bold text-sm text-text-primary">📦 {orderCount} Total Orders Placed</span>
          </div>
        )}

        {/* ── 2×2 Action tiles ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {tiles.map(({ icon: Icon, label, sublabel, bg, iconColor, action }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.95 }}
              onClick={action}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-start gap-3 text-left active:bg-gray-50 transition-colors"
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="font-black text-sm text-text-primary leading-tight">{label}</p>
                <p className="text-[10px] text-text-secondary font-medium mt-0.5 leading-tight">{sublabel}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Legal footer ── */}
        <div className="flex justify-center gap-5 mb-5">
          {(['privacy', 'terms', 'refund'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setPolicyModal(key)}
              className="text-xs text-gray-400 hover:text-brand transition-colors font-medium"
            >
              {key === 'privacy' ? 'Privacy Policy' : key === 'terms' ? 'Terms of Service' : 'Refund Policy'}
            </button>
          ))}
        </div>

        {/* ── Sign Out ── */}
        <button
          onClick={() => { logout(); setStep('form'); }}
          className="flex items-center justify-center gap-2 w-full py-3.5 text-red-500 font-black rounded-2xl text-sm tracking-wider border border-red-100 bg-red-50/50 active:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        {/* ── About SnapIt Modal ── */}
        <AnimatePresence>
          {aboutModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAboutModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm flex flex-col items-center text-center"
              >
                <button onClick={() => setAboutModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-brand rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_20px_rgba(5,150,105,0.3)]">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-black text-xl text-text-primary mb-1">SnapIt KGF</h3>
                <p className="text-text-secondary text-sm mb-1">Version 1.0.0 · Phase 1</p>
                <p className="text-brand text-xs font-bold mb-5">Built by Dhakav Designers</p>
                <div className="bg-gray-50 rounded-2xl p-4 w-full text-left text-xs text-gray-500 space-y-2">
                  <p>🏠 <strong className="text-gray-700">Region:</strong> KGF, Karnataka</p>
                  <p>📦 <strong className="text-gray-700">Focus:</strong> Grocery &amp; Local Food Delivery</p>
                  <p>📞 <strong className="text-gray-700">Support:</strong> +91 82176 49688</p>
                  <p>✉️ <strong className="text-gray-700">Email:</strong> support@snapitkgf.in</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Policy Modals (bottom-sheet) ── */}
        <AnimatePresence>
          {policyModal && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPolicyModal(null)} />
              <motion.div
                initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="relative bg-white rounded-t-[2.5rem] shadow-2xl px-6 pt-5 pb-10 w-full max-w-sm flex flex-col"
              >
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                <button onClick={() => setPolicyModal(null)}
                  className="absolute top-5 right-5 w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-black text-lg text-text-primary mb-3">{policyContent[policyModal].title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{policyContent[policyModal].body}</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    );
  };

  return (
    <div className="p-4 pt-6 pb-28 min-h-screen bg-gray-50/50">
      <AnimatePresence mode="wait">
        {step === 'form' && <React.Fragment key="form">{renderForm()}</React.Fragment>}
        {step === 'success' && <React.Fragment key="success">{renderSuccess()}</React.Fragment>}
        {step === 'dashboard' && <React.Fragment key="dashboard">{renderDashboard()}</React.Fragment>}
      </AnimatePresence>

      {/* SnapIt Phone Verification Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowOtpModal(false)}
            />
            
            {/* Bottom-sheet modal — SnapIt style */}
            <motion.div 
              initial={{ opacity: 0, y: '100%' }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-sm bg-white rounded-t-[2.5rem] shadow-2xl px-6 pt-5 pb-10 flex flex-col"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

              {/* Close */}
              <button 
                onClick={() => setShowOtpModal(false)}
                className="absolute top-5 right-5 w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* SnapIt branded icon area */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <h2 className="font-black text-xl text-text-primary leading-tight">Quick Verify</h2>
                  <p className="text-text-secondary text-xs font-medium">Confirm it's really you</p>
                </div>
              </div>

              {/* Code display — SnapIt green pill */}
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between mb-5">
                <div>
                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Your code</p>
                  <p className="font-mono font-black text-brand text-2xl tracking-[0.2em] mt-0.5">679527</p>
                </div>
                <div className="bg-brand text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">Tap to copy</div>
              </div>
              
              {/* Input */}
              <div className="w-full mb-5">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Type your code here</label>
                <input 
                  type="tel" 
                  maxLength={6} 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="_ _ _ _ _ _"
                  className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-gray-200 placeholder:tracking-[0.4em]" 
                  autoFocus
                />
              </div>

              {/* Action */}
              <button 
                disabled={!isOtpValid}
                onClick={handleOtpConfirm}
                className="w-full h-14 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-brand border-0 shadow-[0_8px_20px_rgba(5,150,105,0.30)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.45)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest rounded-2xl mb-4 disabled:opacity-40 disabled:pointer-events-none"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm &amp; Activate
              </button>

              <div className="flex items-center justify-between px-1">
                <button onClick={() => setShowOtpModal(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                  ← Wrong number?
                </button>
                <button className="text-xs font-black text-brand hover:text-emerald-700 transition-colors uppercase tracking-wider">
                  Resend Code
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
