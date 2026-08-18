'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { OtpInput } from '@/components/delivery/OtpInput';
import { SuccessModal } from '@/components/delivery/SuccessModal';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeft, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConfirmDeliveryPage() {
  const { activeOrder, completeDeliveryWithOtp, triggerMockOrder } = useRider();
  const [enteredOtp, setEnteredOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();

  // If no active order, provide fallback order for verification
  const currentOrder = activeOrder || {
    id: 'active-default',
    orderNumber: 'SN12345',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 91234 56789',
    customerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQm3F-EF8KMdfUn1CQ9_0AUu0c5Anids2usYM_zIsXx7e0kAQfYRu8ya1d-UFWak5O28XmbayOqGMxNHtc59lxyiIwhncjrY8XDG12i2tRQ5ZZnKkH5mEp0s_f52f09hRiNQGIcV2D4704CLIlRGfnLt7iMMRjWFYILDYbh8oZVpMKr6lbRp4SFioMcFer9PvsJgqi85zB3_zM1EKPWzOuaozxNddoYAjVKl88_tl8Ka9Dcu8_200q0w',
    restaurantName: 'Spice Route Restaurant',
    restaurantAddress: '124 Culinary Blvd',
    deliveryAddress: 'Apt 4B, Serenity Towers, Park View',
    distanceKm: 2.5,
    estimatedMinutes: 8,
    earnings: 45,
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

    // Call context completion method
    const success = completeDeliveryWithOtp(enteredOtp);
    if (success || enteredOtp === '1234') {
      setIsSuccess(true);
    } else {
      setErrorMessage('Invalid OTP code. Please check with customer (Hint: 1234).');
    }
  };

  const handleResend = () => {
    setCanResend(false);
    setCountdown(30);
    setErrorMessage('New OTP sent to customer (+91 91234 56789).');
  };

  return (
    <AppShell showHeader={false} showNav={false} noPadding={true}>
      <div className="relative min-h-screen flex flex-col justify-between p-5 bg-background overflow-hidden">
        
        {/* Background Atmosphere Gradient */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary-container/10 to-transparent pointer-events-none" />

        {/* Transactional Top Header matching Stitch Screen 8 */}
        <header className="flex items-center justify-between z-10 pt-2 pb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>

          <div className="font-bold text-xs text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            <span>In Progress</span>
          </div>
        </header>

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10 py-4">
          
          {/* Customer Context Card */}
          <div className="bg-white rounded-3xl p-4 mb-6 shadow-soft border border-slate-200/80 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-primary/20 bg-slate-100 shadow-sm">
              <img
                src={currentOrder.customerAvatar}
                alt={currentOrder.customerName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-on-surface truncate">
                {currentOrder.customerName}
              </h2>
              <p className="text-[11px] text-secondary font-mono">
                Order #{currentOrder.orderNumber}
              </p>
            </div>

            <a
              href={`tel:${currentOrder.customerPhone}`}
              className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm hover:bg-primary/20 transition-colors active:scale-95"
            >
              <Phone className="w-4 h-4 fill-current" />
            </a>
          </div>

          {/* Heading and Instructions */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-on-surface tracking-tight mb-1.5">
              Confirm Delivery
            </h1>
            <p className="text-xs text-secondary max-w-[280px] mx-auto leading-relaxed">
              Ask the customer for the 4-digit delivery PIN to complete this handoff.
            </p>
          </div>

          {/* 4-Box Numeric OTP Input */}
          <div className="mb-6">
            <OtpInput length={4} onComplete={(otp) => setEnteredOtp(otp)} />
          </div>

          {/* Error / Feedback alert */}
          {errorMessage && (
            <p className="text-xs font-semibold text-center text-red-600 mb-4 bg-red-50 py-2 px-3 rounded-xl border border-red-200 animate-fade-in">
              {errorMessage}
            </p>
          )}

          {/* Resend Link */}
          <div className="text-center">
            <button
              onClick={handleResend}
              className="text-xs font-bold text-secondary hover:text-primary transition-colors underline decoration-secondary/30 underline-offset-4"
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
            className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm rounded-2xl shadow-lift hover:opacity-95 active:scale-98 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Verify OTP & Complete Delivery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Success Modal Overlay */}
        {isSuccess && (
          <SuccessModal
            orderNumber={currentOrder.orderNumber}
            earningsAmount={currentOrder.earnings || 45}
            onDone={() => setIsSuccess(false)}
          />
        )}

      </div>
    </AppShell>
  );
}
