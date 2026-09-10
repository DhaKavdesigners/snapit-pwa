'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { OtpInput } from '@/components/delivery/OtpInput';
import { SuccessModal } from '@/components/delivery/SuccessModal';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeft, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
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

        {/* Transactional Top Header */}
        <header className="flex items-center justify-between z-10 pt-2 pb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-2xs border border-slate-200 hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>

          <div className="font-black text-xs text-purple-800 bg-purple-50 border border-purple-200/90 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-purple-600 stroke-[2.5]" />
            <span>PIN Verification</span>
          </div>
        </header>

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10 py-4">
          
          {/* Customer Context Card */}
          <div className="bg-white rounded-[24px] p-4.5 mb-6 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.06)] border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 shadow-2xs">
              <img
                src={currentOrder.customerAvatar}
                alt={currentOrder.customerName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Customer Handoff
              </span>
              <h2 className="font-black text-base text-slate-900 truncate mt-0.5">
                {currentOrder.customerName}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Order #{formatOrderNumber(currentOrder.orderNumber)}
              </p>
            </div>

            <a
              href={`tel:${currentOrder.customerPhone}`}
              className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-200/80 transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <Phone className="w-4 h-4 text-slate-700" />
            </a>
          </div>

          {/* Heading and Instructions */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1.5">
              Enter Delivery PIN
            </h1>
            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              Ask the customer for the 4-digit delivery PIN shown on their order tracking screen.
            </p>
          </div>

          {/* 4-Box Numeric OTP Input */}
          <div className="mb-6">
            <OtpInput length={4} onComplete={(otp) => setEnteredOtp(otp)} />
          </div>

          {/* Error / Feedback alert */}
          {errorMessage && (
            <p className="text-xs font-bold text-center text-rose-600 mb-4 bg-rose-50 py-2.5 px-3.5 rounded-2xl border border-rose-200 animate-fade-in shadow-2xs">
              {errorMessage}
            </p>
          )}

          {/* Resend Link */}
          <div className="text-center">
            <button
              onClick={handleResend}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors underline decoration-slate-300 underline-offset-4 cursor-pointer"
            >
              Resend OTP via SMS
            </button>
          </div>

        </div>

        {/* Fixed Bottom Verify Button */}
        <div className="z-10 pt-4 pb-safe w-full max-w-sm mx-auto">
          <button
            onClick={handleVerify}
            disabled={enteredOtp.length !== 4}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 border border-emerald-500 ring-2 ring-emerald-400/30 active:scale-98 transition-all flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:ring-0 cursor-pointer tracking-wider"
          >
            <span>VERIFY PIN & COMPLETE</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
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
