'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { OtpInput } from '@/components/delivery/OtpInput';
import { SuccessModal } from '@/components/delivery/SuccessModal';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeft, Phone, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatOrderNumber } from '@/utils/orderUtils';

export default function ConfirmDeliveryPage() {
  const { activeOrder, completeDeliveryWithOtp } = useRider();
  const [enteredOtp, setEnteredOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
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
    paymentMethod: 'Prepaid UPI',
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

  const handleResend = () => {
    setCanResend(false);
    setCountdown(30);
    setErrorMessage('New OTP sent to customer (+91 91234 56789).');
  };

  return (
    <AppShell showHeader={false} showNav={false} noPadding={true}>
      <div className="relative min-h-screen flex flex-col justify-between p-5 bg-[#f8fafc] text-slate-900 overflow-hidden">
        
        {/* Background Atmosphere Gradient */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

        {/* Transactional Top Header with Centered Minnit Logo */}
        <header className="relative flex items-center justify-between z-10 pt-2 pb-3 mb-1">
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
          
          {/* Customer Context Card (Professional, No Broken Avatar) */}
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

          {/* Heading and Instructions Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-slate-200/80 text-center space-y-3">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Enter Delivery PIN
              </h1>
              <p className="text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed mt-0.5">
                Ask the customer for the 4-digit PIN shown on their order tracking screen.
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

          {/* Action Button - Shifted up in immediate phone FOV */}
          <div className="pt-1 w-full">
            <button
              onClick={handleVerify}
              disabled={enteredOtp.length !== 4}
              className="w-full h-13 sm:h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/30 active:scale-98 transition-all flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:ring-0 cursor-pointer tracking-wider uppercase"
            >
              <span>VERIFY PIN & COMPLETE</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

        </div>

        {/* Success Modal Overlay */}
        {isSuccess && (
          <SuccessModal
            orderNumber={formatOrderNumber(persistedOrderNumber)}
            earningsAmount={persistedEarnings}
            onDone={() => setIsSuccess(false)}
          />
        )}

      </div>
    </AppShell>
  );
}
