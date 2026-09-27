'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { OtpInput } from '@/components/delivery/OtpInput';
import { SuccessModal } from '@/components/delivery/SuccessModal';
import { AppShell } from '@/components/layout/AppShell';
import {
  ArrowLeft,
  Phone,
  ShieldCheck,
  ArrowRight,
  User,
  QrCode,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatOrderNumber } from '@/utils/orderUtils';
import { RiderDemoController } from '@/components/dashboard/RiderDemoController';

export default function ConfirmDeliveryPage() {
  const { activeOrder, completeDeliveryWithOtp, isDemoMode, completeInteractiveDemo } = useRider();
  const [enteredOtp, setEnteredOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState<boolean>(true);
  const [persistedEarnings, setPersistedEarnings] = useState<number>(activeOrder?.earnings || 30);
  const [persistedOrderNumber, setPersistedOrderNumber] = useState<string>(activeOrder?.orderNumber || '012345');
  const router = useRouter();

  // Keep track of activeOrder details so they persist after completion sets activeOrder to null
  React.useEffect(() => {
    if (activeOrder) {
      if (activeOrder.earnings !== undefined) setPersistedEarnings(activeOrder.earnings);
      if (activeOrder.orderNumber) setPersistedOrderNumber(activeOrder.orderNumber);
    }
  }, [activeOrder]);

  // If no active order, provide fallback order for verification
  const currentOrder = activeOrder || {
    id: 'active-default',
    orderNumber: persistedOrderNumber || '012345',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 91234 56789',
    customerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQm3F-EF8KMdfUn1CQ9_0AUu0c5Anids2usYM_zIsXx7e0kAQfYRu8ya1d-UFWak5O28XmbayOqGMxNHtc59lxyiIwhncjrY8XDG12i2tRQ5ZZnKkH5mEp0s_f52f09hRiNQGIcV2D4704CLIlRGfnLt7iMMRjWFYILDYbh8oZVpMKr6lbRp4SFioMcFer9PvsJgqi85zB3_zM1EKPWzOuaozxNddoYAjVKl88_tl8Ka9Dcu8_200q0w',
    restaurantName: 'Spice Route Restaurant',
    restaurantAddress: '124 Culinary Blvd',
    deliveryAddress: 'Apt 4B, Serenity Towers, Park View',
    distanceKm: 2.5,
    estimatedMinutes: 8,
    earnings: persistedEarnings || 30,
    items: [{ name: 'Chicken Tikka Masala', quantity: 1 }],
    status: 'arrived_at_dropoff' as const,
    otp: '1234',
    timestamp: 'Just now',
    paymentMethod: 'UPI on Delivery',
  };

  const handleVerify = () => {
    setErrorMessage('');
    if (enteredOtp.length !== 4) {
      setErrorMessage('Please enter the complete 4-digit code.');
      return;
    }

    // Capture exact order earnings before context clears activeOrder
    const finalEarnings = activeOrder?.earnings ?? persistedEarnings ?? 30;
    const finalOrderNum = activeOrder?.orderNumber ?? persistedOrderNumber ?? '012345';
    setPersistedEarnings(finalEarnings);
    setPersistedOrderNumber(finalOrderNum);

    // Call context completion method to evaluate against database delivery_pin
    const success = completeDeliveryWithOtp(enteredOtp);
    if (success) {
      setIsSuccess(true);
    } else {
      setErrorMessage('Invalid Delivery PIN. Please ask customer for the 4-digit PIN shown on their live tracking screen.');
    }
  };

  const handleFinishSuccess = () => {
    setIsSuccess(false);
    if (isDemoMode) {
      router.push('/earnings');
    } else {
      router.push('/');
    }
  };

  return (
    <AppShell showHeader={false} showNav={false} noPadding={true}>
      <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-5 bg-[#f8fafc] text-slate-900 overflow-x-hidden">
        
        {/* Background Atmosphere Gradient */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

        {/* Transactional Top Header with Centered Minnit Logo */}
        <header className="relative flex items-center justify-between z-10 pt-1 pb-3 mb-1">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-2xs border border-slate-200 hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer z-10"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>

          {/* Minnit Logo Centered at Top Header */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/images/minnit_logo_main.png"
              alt="Minnit"
              className="h-8 w-auto object-contain select-none"
              style={{ imageRendering: 'auto' }}
            />
          </div>

          <div className="font-bold text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs z-10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            <span>PIN Check</span>
          </div>
        </header>

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col justify-start max-w-sm mx-auto w-full z-10 pt-1 pb-4 space-y-3">

          {/* Demo Mode Guidance Banner */}
          {isDemoMode && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-3.5 shadow-lg border border-emerald-400/40 flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
                  Final Demo Step
                </span>
                <p className="text-xs font-bold text-white leading-snug">
                  Ask customer for 4-digit PIN (<strong className="text-amber-300 font-mono">Demo PIN: 1234</strong>). If UPI payment, show Minnit QR below!
                </p>
              </div>
            </div>
          )}
          
          {/* Customer Context Card */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-soft border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                <User className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Customer Handoff
                </span>
                <h2 className="font-black text-base text-slate-900 truncate">
                  {currentOrder.customerName}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Order #{formatOrderNumber(currentOrder.orderNumber)}
                </p>
              </div>
            </div>

            <a
              href={`tel:${currentOrder.customerPhone}`}
              className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
              title="Call Customer"
              aria-label="Call Customer"
            >
              <Phone className="w-4 h-4 text-white" />
            </a>
          </div>

          {/* Minnit UPI QR Code Card (Collapsible) */}
          <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-200/80 space-y-3">
            <button
              type="button"
              onClick={() => setShowUpiQr(!showUpiQr)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                    Minnit UPI QR Pay
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Scan with GPay, PhonePe, Paytm, or BHIM
                  </p>
                </div>
              </div>
              <div className="text-slate-400">
                {showUpiQr ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showUpiQr && (
              <div className="pt-2 flex flex-col items-center text-center space-y-2.5 border-t border-slate-100 animate-fade-in">
                {/* Simulated Minnit UPI QR Canvas */}
                <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md flex flex-col items-center">
                  <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="white" />
                    {/* Corner Position Detection Squares */}
                    <rect x="5" y="5" width="26" height="26" fill="black" rx="4" />
                    <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                    <rect x="13" y="13" width="10" height="10" fill="#059669" rx="1" />

                    <rect x="69" y="5" width="26" height="26" fill="black" rx="4" />
                    <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                    <rect x="77" y="13" width="10" height="10" fill="#059669" rx="1" />

                    <rect x="5" y="69" width="26" height="26" fill="black" rx="4" />
                    <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                    <rect x="13" y="77" width="10" height="10" fill="#059669" rx="1" />

                    {/* Data QR matrix dots */}
                    <rect x="37" y="8" width="6" height="6" fill="#1e293b" />
                    <rect x="49" y="8" width="6" height="6" fill="#1e293b" />
                    <rect x="37" y="20" width="6" height="6" fill="#1e293b" />
                    <rect x="49" y="20" width="6" height="6" fill="#1e293b" />

                    <rect x="8" y="37" width="6" height="6" fill="#1e293b" />
                    <rect x="20" y="37" width="6" height="6" fill="#1e293b" />
                    <rect x="8" y="49" width="6" height="6" fill="#1e293b" />
                    <rect x="20" y="49" width="6" height="6" fill="#1e293b" />

                    <rect x="37" y="37" width="26" height="26" fill="#047857" rx="4" />
                    <text x="50" y="55" fill="white" fontSize="14" fontWeight="900" textAnchor="middle">M</text>

                    <rect x="69" y="37" width="6" height="6" fill="#1e293b" />
                    <rect x="81" y="37" width="6" height="6" fill="#1e293b" />
                    <rect x="69" y="49" width="6" height="6" fill="#1e293b" />
                    <rect x="81" y="49" width="6" height="6" fill="#1e293b" />

                    <rect x="37" y="69" width="6" height="6" fill="#1e293b" />
                    <rect x="49" y="69" width="6" height="6" fill="#1e293b" />
                    <rect x="37" y="81" width="6" height="6" fill="#1e293b" />
                    <rect x="49" y="81" width="6" height="6" fill="#1e293b" />

                    <rect x="69" y="69" width="6" height="6" fill="#1e293b" />
                    <rect x="81" y="69" width="6" height="6" fill="#1e293b" />
                    <rect x="69" y="81" width="6" height="6" fill="#1e293b" />
                    <rect x="81" y="81" width="6" height="6" fill="#1e293b" />
                  </svg>
                  <span className="text-[10px] font-mono font-black text-slate-700 mt-1">
                    minnitops@icici
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant Payment Confirmation via Minnit Network</span>
                </div>
              </div>
            )}
          </div>

          {/* Heading and Instructions Card */}
          <div id="delivery-pin-section" className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-slate-200/80 text-center space-y-3">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Enter Delivery PIN
              </h1>
              <p className="text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed mt-0.5">
                Ask customer for 4-digit PIN shown on their order tracking screen.
              </p>
            </div>

            {/* 4-Box Numeric OTP Input */}
            <div className="py-1">
              <OtpInput length={4} onComplete={(otp) => setEnteredOtp(otp)} />
            </div>

            {/* Error / Feedback alert */}
            {errorMessage && (
              <p className="text-xs font-bold text-center text-rose-600 bg-rose-50 py-2.5 px-3.5 rounded-2xl border border-rose-200 animate-fade-in shadow-2xs">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-1 w-full">
            <button
              onClick={handleVerify}
              disabled={enteredOtp.length !== 4}
              className="w-full h-13 sm:h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/30 active:scale-98 transition-all flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:ring-0 cursor-pointer tracking-wider uppercase"
            >
              <span>VERIFY PIN &amp; COMPLETE</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

        </div>

        {/* Success Modal Overlay */}
        {isSuccess && (
          <SuccessModal
            orderNumber={formatOrderNumber(persistedOrderNumber)}
            earningsAmount={persistedEarnings}
            onDone={handleFinishSuccess}
          />
        )}

        {/* Demo Guidance Controller */}
        <RiderDemoController />
      </div>
    </AppShell>
  );
}
