/**
 * LoginPage.tsx — Mock authentication flow for Phase 1
 *
 * Phone number → mock OTP → rider profile created in Zustand.
 * Real Supabase Phone OTP wired in Phase 2.
 * Test credentials: any 10-digit number + OTP "0000"
 */

import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useRiderStore } from '../stores/riderStore';
import { MOCK_RIDER } from '../lib/mockData';
import { unlockAudio } from '../lib/audio';

type Step = 'phone' | 'otp';

const MOCK_VALID_OTP = '0000';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setRider, setAuthenticated } = useRiderStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsLoading(true);
    // Simulate OTP send delay
    await new Promise((r) => setTimeout(r, 900));
    setIsLoading(false);
    setStep('otp');
  };

  const handleVerifyOtp = async () => {
    setError('');
    setIsLoading(true);
    // Simulate verification delay
    await new Promise((r) => setTimeout(r, 700));

    if (otp !== MOCK_VALID_OTP) {
      setIsLoading(false);
      setError('Incorrect OTP. Use 0000 for demo.');
      return;
    }

    // Unlock audio context on first gesture
    unlockAudio();

    // Set mock rider profile
    setRider({
      ...MOCK_RIDER,
      phone: `+91${phone.replace(/\D/g, '')}`,
    });
    setAuthenticated(true);
    setIsLoading(false);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Top brand section */}
      <div className="brand-gradient flex-none px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="text-5xl mb-3">🛵</div>
          <h1 className="text-white font-extrabold text-3xl tracking-tight">SnapIt Rider</h1>
          <p className="text-emerald-200 text-sm font-medium mt-2">
            KGF's fastest fulfillment engine
          </p>
        </motion.div>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="flex-1 -mt-6 rounded-t-3xl bg-white px-6 pt-8 pb-10 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-slate-900 font-bold text-2xl mb-1">Enter your number</h2>
              <p className="text-slate-500 text-sm font-medium mb-8">
                We'll send a verification code to confirm your identity.
              </p>

              {/* Phone input */}
              <div className="mb-5">
                <label className="block text-slate-700 text-sm font-semibold mb-2">
                  Mobile Number
                </label>
                <div className={`
                  flex items-center gap-3 border-2 rounded-xl px-4 h-14
                  transition-colors duration-200
                  ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus-within:border-emerald-500 bg-white'}
                `}>
                  <Phone size={18} className="text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 font-semibold text-sm">+91</span>
                  <div className="w-px h-5 bg-slate-200" />
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    placeholder="98765 43210"
                    className="flex-1 bg-transparent text-slate-800 font-semibold text-base placeholder:text-slate-300 focus:outline-none"
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs font-medium mt-2"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <button
                id="send-otp-btn"
                onClick={handleSendOtp}
                disabled={isLoading || phone.length < 10}
                className="btn-primary w-full h-14 flex items-center justify-center gap-2"
              >
                {isLoading
                  ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <>Send OTP <ArrowRight size={18} /></>
                }
              </button>

              {/* Phase 1 demo hint */}
              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-amber-700 text-xs font-semibold">🧪 Phase 1 Demo</p>
                <p className="text-amber-600 text-xs mt-0.5">
                  Enter any 10-digit number. OTP is <strong>0000</strong>.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="flex items-center gap-1 text-slate-500 text-sm font-medium mb-6 -ml-1"
              >
                <ChevronLeft size={16} /> Change number
              </button>

              <h2 className="text-slate-900 font-bold text-2xl mb-1">Enter OTP</h2>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Sent to <strong>+91 {phone}</strong>
              </p>

              {/* OTP input */}
              <div className="mb-5">
                <label className="block text-slate-700 text-sm font-semibold mb-2">
                  4-Digit Code
                </label>
                <div className={`
                  flex items-center gap-3 border-2 rounded-xl px-4 h-14
                  transition-colors duration-200
                  ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus-within:border-emerald-500 bg-white'}
                `}>
                  <ShieldCheck size={18} className="text-slate-400 flex-shrink-0" />
                  <input
                    id="otp-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setError('');
                    }}
                    placeholder="0000"
                    className="flex-1 bg-transparent text-slate-800 font-bold text-2xl tracking-[0.4em] placeholder:text-slate-300 focus:outline-none"
                    autoFocus
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs font-medium mt-2"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <button
                id="verify-otp-btn"
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length !== 4}
                className="btn-primary w-full h-14 flex items-center justify-center gap-2"
              >
                {isLoading
                  ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <>Verify & Login <ArrowRight size={18} /></>
                }
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs font-medium mt-8">
          By logging in, you agree to SnapIt's{' '}
          <span className="text-emerald-600 font-semibold">Rider Terms</span>.
          <br />Powered by <strong>Dhakav Designers</strong> · KGF
        </p>
      </motion.div>
    </div>
  );
}
