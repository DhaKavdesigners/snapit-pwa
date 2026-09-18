'use client';

import React, { useState, useEffect } from 'react';
import { useRider } from '@/context/RiderContext';
import { AppShell } from '@/components/layout/AppShell';
import { SelfieCamera } from '@/components/onboarding/SelfieCamera';
import { DocumentUploadCard } from '@/components/onboarding/DocumentUploadCard';
import { ZoneSelectCard } from '@/components/onboarding/ZoneSelectCard';
import {
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Hourglass,
  Check,
  AlertCircle,
  FileCheck,
  Lock,
  Phone,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Copy,
  UserCheck,
  Sparkles,
  RefreshCw,
  XCircle,
  Clock,
  Radio,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RiderInstructionViewer } from '@/components/common/RiderInstructionViewer';

export default function OnboardingPage() {
  const {
    rider,
    zones,
    updateRiderProfile,
    simulateApproval,
    registerRider,
    loginWithRiderId,
    sessionInvalidatedMessage,
    clearSessionInvalidatedMessage,
  } = useRider();
  const [step, setStep] = useState<
    'splash' | 'signin' | 'selfie' | 'personal' | 'kyc' | 'zone' | 'reg_waiting' | 'approved' | 'rejected' | 'reg_success' | 'status'
  >('splash');
  
  // Login form state
  const [loginRiderId, setLoginRiderId] = useState('');
  const [loginMpin, setLoginMpin] = useState('');
  const [showLoginMpin, setShowLoginMpin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Registration success & verification state
  const [registeredRiderId, setRegisteredRiderId] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckNotice, setStatusCheckNotice] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regError, setRegError] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [showWaitingInstructions, setShowWaitingInstructions] = useState(false);

  // Step 1: Personal & Contact fields
  const [fullName, setFullName] = useState(rider.name || '');
  const [dob, setDob] = useState(rider.dob || '');
  const [email, setEmail] = useState(rider.email || '');
  const [phone, setPhone] = useState(rider.phone || '');
  const [confirmPhone, setConfirmPhone] = useState(rider.phone || '');
  const [altPhone, setAltPhone] = useState(rider.altPhone || '');
  const [address, setAddress] = useState(rider.address || '');
  const [vehicleType, setVehicleType] = useState(rider.vehicleType || 'Motorcycle');
  const [vehicleNumber, setVehicleNumber] = useState(rider.vehicleNumber || '');
  const [createMpin, setCreateMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [showRegMpin, setShowRegMpin] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Step 2: Selfie
  const [capturedSelfie, setCapturedSelfie] = useState<string>(rider.selfieCapturedUrl || '');

  // Step 3: KYC Details & Attachments
  const [aadhaarNumber, setAadhaarNumber] = useState(rider.aadhaarNumber || '');
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState('');
  const [panNumber, setPanNumber] = useState(rider.panNumber || '');
  const [panDocUrl, setPanDocUrl] = useState('');
  const [dlNumber, setDlNumber] = useState(rider.dlNumber || '');
  const [dlDocUrl, setDlDocUrl] = useState('');
  const [upiId, setUpiId] = useState(rider.upiId || '');

  // Step 4: Zone
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || 'zone-1');

  const router = useRouter();
 
  // Automatically transition from splash screen to signin after 2 seconds
  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        setStep('signin');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle Login with Rider ID + MPIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (clearSessionInvalidatedMessage) clearSessionInvalidatedMessage();

    const cleanInput = loginRiderId.trim();
    if (!cleanInput) {
      setLoginError('Please enter your Minnit Rider ID.');
      return;
    }

    if (!loginMpin || loginMpin.length < 4) {
      setLoginError('Please enter your 4-digit MPIN.');
      return;
    }

    setIsLoggingIn(true);
    const result = await loginWithRiderId(cleanInput, loginMpin);
    setIsLoggingIn(false);

    if (!result.success) {
      if (result.verificationStatus === 'PENDING') {
        setRegisteredRiderId(result.riderId || cleanInput);
        setStep('reg_waiting');
        return;
      }
      if (result.verificationStatus === 'REJECTED') {
        setRegisteredRiderId(result.riderId || cleanInput);
        setRejectionReason(result.error || 'Your registration could not be approved at this time.');
        setStep('rejected');
        return;
      }
      setLoginError(result.error || 'Incorrect Rider ID or MPIN. Please try again.');
      return;
    }

    router.push('/');
  };

  // ── 1. Real-Time Verification Status Subscription ──
  useEffect(() => {
    const targetPhone = registeredPhone || phone.replace(/[^0-9]/g, '') || rider.phone;
    const targetId = registeredRiderId || rider.Rider_ID || rider.riderId;

    if (step !== 'reg_waiting') return;
    if (!targetPhone && !targetId) return;

    console.log('⚡ [Rider Realtime] Listening for approval on rider_profiles:', { targetPhone, targetId });

    const channel = supabase
      .channel(`rider-approval-watch-${targetPhone || targetId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rider_profiles',
          filter: targetPhone ? `phone=eq.${targetPhone}` : `id=eq.${targetId}`,
        },
        (payload: any) => {
          console.log('⚡ [Rider Realtime] Approval event received:', payload.new);
          const newStatus = payload.new?.verification_status;
          const isVerified = payload.new?.is_verified;

          if (payload.new?.Rider_ID && !registeredRiderId) {
            setRegisteredRiderId(payload.new.Rider_ID);
          }

          if (newStatus === 'APPROVED' || isVerified === true) {
            setStep('approved');
          } else if (newStatus === 'REJECTED') {
            setRejectionReason(payload.new?.rejection_reason || 'Documents could not be verified.');
            setStep('rejected');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [step, registeredPhone, registeredRiderId, phone, rider.Rider_ID, rider.phone, rider.riderId]);

  // ── 2. Periodic Status Polling Fallback (Every 6 seconds) ──
  useEffect(() => {
    if (step !== 'reg_waiting') return;
    const targetPhone = registeredPhone || phone.replace(/[^0-9]/g, '') || rider.phone;
    const targetId = registeredRiderId || rider.Rider_ID || rider.riderId;
    if (!targetPhone && !targetId) return;

    const pollTimer = setInterval(async () => {
      try {
        let query = supabase.from('rider_profiles').select('id, phone, Rider_ID, verification_status, is_verified, rejection_reason');
        if (targetPhone) {
          query = query.eq('phone', targetPhone);
        } else {
          query = query.or(`id.eq.${targetId},Rider_ID.eq.${targetId}`);
        }

        const { data } = await query.maybeSingle();
        if (data) {
          if (data.Rider_ID && !registeredRiderId) {
            setRegisteredRiderId(data.Rider_ID);
          }
          if (data.verification_status === 'APPROVED' || data.is_verified === true) {
            setStep('approved');
          } else if (data.verification_status === 'REJECTED') {
            setRejectionReason(data.rejection_reason || 'Documents could not be verified.');
            setStep('rejected');
          }
        }
      } catch (err) {
        // Silent poll error
      }
    }, 6000);

    return () => clearInterval(pollTimer);
  }, [step, registeredPhone, registeredRiderId, phone, rider.Rider_ID, rider.phone, rider.riderId]);

  // ── 3. Manual Check Status Action ──
  const handleManualCheckStatus = async () => {
    setIsCheckingStatus(true);
    setStatusCheckNotice('');
    const targetPhone = registeredPhone || phone.replace(/[^0-9]/g, '') || rider.phone;
    const targetId = registeredRiderId || rider.Rider_ID || rider.riderId;

    try {
      let query = supabase.from('rider_profiles').select('id, phone, Rider_ID, verification_status, is_verified, rejection_reason');
      if (targetPhone) {
        query = query.eq('phone', targetPhone);
      } else if (targetId) {
        query = query.or(`id.eq.${targetId},Rider_ID.eq.${targetId}`);
      }

      const { data, error } = await query.maybeSingle();
      setIsCheckingStatus(false);

      if (error) {
        setStatusCheckNotice("We couldn't update your verification status. Please check your connection and try again.");
        return;
      }

      if (!data) {
        setStatusCheckNotice('Rider profile is being initialized...');
        return;
      }

      if (data.Rider_ID && !registeredRiderId) {
        setRegisteredRiderId(data.Rider_ID);
      }

      if (data.verification_status === 'APPROVED' || data.is_verified === true) {
        setStep('approved');
      } else if (data.verification_status === 'REJECTED') {
        setRejectionReason(data.rejection_reason || 'Documents could not be verified.');
        setStep('rejected');
      } else {
        setStatusCheckNotice('Still under review by Minnit Admin. Please wait.');
        setTimeout(() => setStatusCheckNotice(''), 4000);
      }
    } catch (err) {
      setIsCheckingStatus(false);
      setStatusCheckNotice("We couldn't update your verification status. Please check your connection and try again.");
    }
  };

  // Validate personal details & phone numbers matching & MPIN
  const handlePersonalSubmit = () => {
    setPhoneError('');
    if (!fullName.trim()) {
      setPhoneError('Please enter your full name as per government ID.');
      return;
    }

    const cleanPhone1 = phone.replace(/[^0-9]/g, '');
    const cleanPhone2 = confirmPhone.replace(/[^0-9]/g, '');

    if (!cleanPhone1 || cleanPhone1.length < 10) {
      setPhoneError('Please enter a valid 10-digit primary mobile number.');
      return;
    }

    if (cleanPhone1 !== cleanPhone2) {
      setPhoneError('Phone numbers do not match! Please verify the confirmation number.');
      return;
    }

    if (!createMpin || createMpin.length < 4) {
      setPhoneError('Please create a 4-digit login MPIN.');
      return;
    }

    if (createMpin !== confirmMpin) {
      setPhoneError('Create MPIN and Confirm MPIN do not match!');
      return;
    }

    updateRiderProfile({
      name: fullName,
      dob,
      email,
      phone,
      altPhone,
      address,
      vehicleType,
      vehicleNumber,
      mpin: createMpin,
    });

    setStep('selfie');
  };

  // Submit KYC
  const handleKycSubmit = () => {
    updateRiderProfile({
      aadhaarNumber,
      panNumber,
      dlNumber,
      upiId,
    });
    setStep('zone');
  };

  // Submit Zone & complete registration
  const handleZoneSubmit = async () => {
    setRegError('');
    setIsSubmittingReg(true);
    const matchedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
    const cleanPhone1 = phone.replace(/[^0-9]/g, '');

    const result = await registerRider({
      name: fullName,
      phone: cleanPhone1,
      mpin: createMpin,
      dob,
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase(),
      selectedZoneId: matchedZone?.id || 'zone-1',
      selectedZone: matchedZone?.name || 'Robertsonpet',
      altPhone,
      email,
      address,
      aadhaarNumber,
      aadhaarDocUrl,
      panNumber,
      panDocUrl,
      dlNumber,
      dlDocUrl,
      upiId,
      selfieCapturedUrl: capturedSelfie,
    });
    setIsSubmittingReg(false);

    if (!result.success || !result.riderId) {
      setRegError(result.error || 'Failed to save rider profile in Supabase. Please try again.');
      return;
    }

    setRegisteredRiderId(result.riderId);
    setRegisteredPhone(cleanPhone1);
    setStep('reg_waiting');
    setShowWaitingInstructions(true);
  };

  const handleCopyRiderId = () => {
    if (!registeredRiderId) return;
    try {
      navigator.clipboard.writeText(registeredRiderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    } catch {}
  };

  // Admin Approval Simulator
  const handleSimulateApprove = () => {
    simulateApproval();
    router.push('/');
  };

  return (
    <AppShell showHeader={false} showNav={false} noPadding={true}>
      <div className={`min-h-screen bg-background flex flex-col justify-between relative overflow-hidden ${showWaitingInstructions ? 'p-0' : 'p-5'}`}>
        
        {/* SCREEN 1: SPLASH SCREEN (CLEAN LOGO, AUTO-NAVIGATES IN 2 SECONDS) */}
        {step === 'splash' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-scale-up">
            {/* Clean Minnit Logo */}
            <div className="relative mb-6">
              <img
                src="/images/minnit_logo_main.png"
                alt="Minnit Logo"
                className="w-56 h-auto object-contain select-none filter drop-shadow-sm animate-pulse-soft"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            <h1 className="text-3xl font-black text-on-surface tracking-tight mb-2">
              Welcome to <span className="text-primary">Minnit</span>
            </h1>
            <p className="text-sm font-medium text-secondary mb-6">
              Deliver smarter. Earn better.
            </p>

            {/* Subtle loading pulse */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-primary/40 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
          </div>
        )}

        {/* SCREEN 2: SIGN-IN */}
        {step === 'signin' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 sm:py-6 animate-fade-in">
            <div className="w-full flex items-center mb-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    window.history.back();
                  } else {
                    setStep('splash');
                  }
                }}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 active:scale-95 transition-all cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-on-surface" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center my-auto">
              {/* Crisp Minnit Brand Logo (High-Res, No Pixelation) */}
              <div className="mb-4 flex items-center justify-center">
                <img
                  src="/images/minnit_logo_main.png"
                  alt="Minnit"
                  className="w-48 max-w-[200px] h-auto object-contain select-none"
                  style={{ imageRendering: 'auto' }}
                />
              </div>

              <h2 className="text-2xl font-black text-on-surface mb-1.5 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-secondary mb-4">
                Start delivering with Minnit in your city today
              </p>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="w-full bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 space-y-4 text-left mb-3">
                {/* Rider ID */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Minnit Rider ID</span>
                  </label>
                  <input
                    type="text"
                    value={loginRiderId}
                    onChange={(e) => setLoginRiderId(e.target.value)}
                    placeholder="e.g. MM0001"
                    autoCapitalize="characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 outline-none focus:border-primary focus:bg-white shadow-inner uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>

                {/* MPIN */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>4-Digit Login MPIN</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Forgot MPIN?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginMpin ? 'text' : 'password'}
                      value={loginMpin}
                      onChange={(e) => setLoginMpin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest font-bold text-slate-900 outline-none focus:border-primary focus:bg-white shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginMpin(!showLoginMpin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginMpin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Session Invalidation Alert (logged out on another phone) */}
                {sessionInvalidatedMessage && (
                  <div className="flex items-start gap-2.5 bg-amber-50 text-amber-900 p-3 rounded-2xl border border-amber-200 text-xs font-medium leading-relaxed animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>{sessionInvalidatedMessage}</span>
                  </div>
                )}

                {/* Login Error */}
                {loginError && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-200 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn || !loginRiderId.trim() || loginMpin.length < 4}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-xl shadow-lift hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoggingIn ? 'Verifying...' : 'Sign In with Rider ID'}</span>
                </button>
              </form>

              {/* Register Profile Option */}
              <div className="w-full text-center">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">New to Minnit?</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  onClick={() => setStep('personal')}
                  className="w-full py-3.5 bg-white border border-primary text-primary font-bold text-xs rounded-2xl shadow-soft hover:bg-primary/5 active:scale-98 transition-all flex items-center justify-center gap-2 mt-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Profile</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-secondary text-center leading-relaxed">
              By continuing, you agree to Minnit&apos;s{' '}
              <a href="#" className="text-primary underline">Terms of Service</a> and{' '}
              <a href="#" className="text-primary underline">Privacy Policy</a>
            </p>
          </div>
        )}

        {/* STEP 1: PERSONAL DETAILS (NAME, DOB, EMAIL, 2x PHONE, ALT PHONE, ADDRESS, VEHICLE, MPIN) */}
        {step === 'personal' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() => setStep('signin')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 1 of 4: Personal Details
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Personal Information</h1>
              <p className="text-xs text-secondary mt-0.5">
                Fill in your basic information and vehicle registration.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-1/4" />
              </div>
            </div>

            {/* Personal Info Form */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As per Aadhaar/PAN"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Date of Birth (DOB)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Primary Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Primary Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Confirm Phone Number (Double-Entry Validation) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">
                  Confirm Phone Number <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  value={confirmPhone}
                  onChange={(e) => setConfirmPhone(e.target.value)}
                  placeholder="Re-enter phone number"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Phone validation alert */}
              {phoneError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{phoneError}</span>
                </div>
              )}

              {/* Alternative Number (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">
                  Alternative Phone Number <span className="text-secondary font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Vehicle Type & Number */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Electric Scooter">EV Scooter</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="KA 03 EQ 8821"
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-semibold text-on-surface outline-none focus:border-primary uppercase"
                  />
                </div>
              </div>

              {/* ── CREATE & CONFIRM MPIN SLOTS ── */}
              <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Create Login MPIN</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegMpin(!showRegMpin)}
                    className="text-[11px] font-bold text-primary flex items-center gap-1"
                  >
                    {showRegMpin ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-secondary block mb-1">Create MPIN *</span>
                    <input
                      type={showRegMpin ? 'text' : 'password'}
                      value={createMpin}
                      onChange={(e) => setCreateMpin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-center text-sm font-mono tracking-widest font-bold text-slate-900 outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-secondary block mb-1">Confirm MPIN *</span>
                    <input
                      type={showRegMpin ? 'text' : 'password'}
                      value={confirmMpin}
                      onChange={(e) => setConfirmMpin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-center text-sm font-mono tracking-widest font-bold text-slate-900 outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Residential Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Residential Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full permanent residential address"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <button
              onClick={handlePersonalSubmit}
              className="w-full py-4 bg-primary text-white font-bold text-xs rounded-2xl shadow-lift hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Live Selfie</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: DEDICATED LIVE SELFIE CAMERA PAGE */}
        {step === 'selfie' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() => setStep('personal')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 2 of 4: Live Selfie
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Capture Live Photo</h1>
              <p className="text-xs text-secondary mt-0.5">
                Take a clear front-facing selfie for rider badge and instant facial ID verification.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-2/4" />
              </div>
            </div>

            {/* Dedicated Camera Viewport Component */}
            <div className="py-4 my-auto">
              <SelfieCamera
                initialPhotoUrl={capturedSelfie}
                onPhotoCaptured={(url) => {
                  setCapturedSelfie(url);
                  updateRiderProfile({ selfieCapturedUrl: url, avatarUrl: url });
                }}
              />
            </div>

            <button
              onClick={() => {
                if (!capturedSelfie) {
                  // If user didn't capture, default sample photo
                  const sample =
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuC-PEiTgWViD1ovXWhH1B1TQbMaWamoTZBv9VbCDabgGy61BlhUVTtyCaQqeI5WbDHOFao2v1A6tBhc7gUUm_4Kw7IjE4g7U93BvPxpBCwFcpkL3WKodfrio1p1RyKPuUw3qMZ3ehzSz5_NUemOI3BVvFqRDj3EdyCQfpGH2eWP1FbJCAvX16Yy7ZGqOdSYHx44o2sVTKEs0VZ56ZU7EjUIFOEJHw_qX6azzfjVcPoCJ7EDvRR1lx43EA';
                  setCapturedSelfie(sample);
                  updateRiderProfile({ selfieCapturedUrl: sample, avatarUrl: sample });
                }
                setStep('kyc');
              }}
              className="w-full py-4 bg-primary text-white font-bold text-xs rounded-2xl shadow-lift hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to KYC Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: KYC DOCUMENTS (AADHAAR + PAN + DL + ATTACHMENTS) */}
        {step === 'kyc' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() => setStep('selfie')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 3 of 4: KYC Documents
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Identity & License Verification</h1>
              <p className="text-xs text-secondary mt-0.5">
                Enter government ID numbers and attach clear scans/photos.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-3/4" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
              {/* 1. Aadhaar Card */}
              <div className="space-y-1.5">
                <DocumentUploadCard
                  title="Aadhaar Card"
                  subtitle="Front & Back (JPG/PNG/PDF)"
                  documentType="aadhaar"
                  documentNumber={aadhaarNumber}
                  onNumberChange={setAadhaarNumber}
                  onFileUploaded={(url) => setAadhaarDocUrl(url)}
                />
              </div>

              {/* 2. PAN Card */}
              <div className="space-y-1.5">
                <DocumentUploadCard
                  title="PAN Card"
                  subtitle="Front scan (JPG/PNG/PDF)"
                  documentType="pan"
                  documentNumber={panNumber}
                  onNumberChange={setPanNumber}
                  onFileUploaded={(url) => setPanDocUrl(url)}
                />
              </div>

              {/* 3. Driving License */}
              <div className="space-y-1.5">
                <DocumentUploadCard
                  title="Driving License (DL)"
                  subtitle="Front & Back scan (JPG/PNG/PDF)"
                  documentType="dl"
                  documentNumber={dlNumber}
                  onNumberChange={setDlNumber}
                  onFileUploaded={(url) => setDlDocUrl(url)}
                />
              </div>

              {/* 4. Payout UPI ID */}
              <div className="space-y-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <label className="text-xs font-bold text-slate-900">Payout UPI ID (For Wallet Cashout)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@bank"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-semibold text-slate-900 outline-none focus:border-primary focus:bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleKycSubmit}
              className="w-full py-4 bg-primary text-white font-bold text-xs rounded-2xl shadow-lift hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Zone Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: ZONE SELECTION */}
        {step === 'zone' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() => setStep('kyc')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 4 of 4: Zone Selection
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Select Operating Zone</h1>
              <p className="text-xs text-secondary mt-0.5">
                Choose where you want to receive delivery requests.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-full" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3">
              {zones.map((z) => (
                <ZoneSelectCard
                  key={z.id}
                  zone={z}
                  isSelected={selectedZoneId === z.id}
                  onSelect={() => setSelectedZoneId(z.id)}
                />
              ))}
            </div>

            {regError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold mb-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <button
              onClick={handleZoneSubmit}
              disabled={isSubmittingReg}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-2xl shadow-lift hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmittingReg ? 'Saving Registration...' : 'Submit Application for Approval'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── SCREEN: REGISTRATION SUCCESSFUL / WAITING FOR ADMIN VERIFICATION ── */}
        {showWaitingInstructions ? (
          <div className="flex-1 min-h-0 flex flex-col justify-between max-w-md mx-auto w-full h-[100dvh] animate-fade-in">
            <RiderInstructionViewer
              isModal={false}
              onDone={() => setShowWaitingInstructions(false)}
              onClose={() => setShowWaitingInstructions(false)}
            />
          </div>
        ) : (step === 'reg_waiting' || step === 'reg_success' || step === 'status') ? (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-5 animate-fade-in">
            <div className="flex flex-col items-center text-center mt-1">
              {/* Radar pulse status icon */}
              <div className="relative w-18 h-18 mb-3 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping opacity-75" />
                <div className="relative z-10 w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 text-white">
                  <Hourglass className="w-7 h-7 animate-pulse" />
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[11px] font-black uppercase px-3.5 py-1 rounded-full border border-amber-200 mb-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Verification Pending</span>
              </div>

              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Registration Successful
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-[300px] leading-relaxed">
                Your Minnit Rider registration has been submitted successfully.
              </p>
            </div>

            {/* Rider ID Card */}
            <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/90 my-3 text-center space-y-3.5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Your Minnit Rider ID
                </p>
                <div className="mt-1.5 py-3 px-4 bg-emerald-50/80 rounded-2xl border-2 border-emerald-500/40 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-black font-mono tracking-widest text-emerald-700">
                    {registeredRiderId || rider.Rider_ID || 'MM0001'}
                  </span>
                </div>
              </div>

              {/* Copy Rider ID Button */}
              <button
                type="button"
                onClick={handleCopyRiderId}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  copiedId
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-98'
                }`}
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Rider ID Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Rider ID</span>
                  </>
                )}
              </button>

              {/* Status Explanation Box */}
              <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-200/70 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Waiting for Admin Verification</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Your documents and profile details are now waiting for verification by the Minnit Admin Team. You will be able to log in once your registration is approved.
                </p>
              </div>

              {/* Checklist preview */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-left">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Selfie Uploaded</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>KYC Documents</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zone Assigned</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <Hourglass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Admin Sign-off</span>
                </div>
              </div>
            </div>

            {/* Read Rider Instructions CTA Card */}
            <button
              type="button"
              onClick={() => setShowWaitingInstructions(true)}
              className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 rounded-2xl p-3 text-left flex items-center justify-between transition-all active:scale-98 cursor-pointer shadow-2xs mb-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📖</span>
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    Read Rider Instructions
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Learn how Minnit deliveries, slots & earnings work
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0" />
            </button>

            {/* Realtime Status Live Sync Bar & Refresh Option */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs shadow-sm">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-slate-300">
                    Live Real-Time Sync Active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  disabled={isCheckingStatus}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>{isCheckingStatus ? 'Checking...' : 'Check Status'}</span>
                </button>
              </div>

              {statusCheckNotice && (
                <p className="text-[11px] text-center text-amber-700 font-medium px-2">
                  {statusCheckNotice}
                </p>
              )}

              {/* Safe instruction */}
              <p className="text-[10px] text-center text-slate-400 leading-tight">
                Please keep your Rider ID safe. Login access will be granted automatically once approved.
              </p>

              {/* Back to Sign-in Option */}
              <button
                type="button"
                onClick={() => {
                  setLoginRiderId(registeredRiderId || rider.Rider_ID || '');
                  setLoginMpin('');
                  setLoginError('');
                  setStep('signin');
                }}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-xs font-bold text-center transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SCREEN: APPROVED CONFIRMATION (REAL-TIME TRANSITION) ── */}
        {step === 'approved' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-6 animate-scale-up">
            <div className="flex flex-col items-center text-center mt-3">
              {/* Celebration Icon */}
              <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-75" />
                <div className="relative z-10 w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
                  <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase px-3.5 py-1 rounded-full border border-emerald-200 mb-2 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Account Verified</span>
              </div>

              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                You&apos;re Approved! 🎉
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-[280px] leading-relaxed">
                Your Minnit Rider account has been successfully verified by the Minnit Admin Team.
              </p>
            </div>

            {/* Approved Account Card */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200/90 my-auto text-center space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Ready for Delivery Cockpit
                </p>
                <div className="mt-2 py-3.5 px-4 bg-emerald-50/90 rounded-2xl border-2 border-emerald-500/40 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-black font-mono tracking-widest text-emerald-700">
                    {registeredRiderId || rider.Rider_ID || 'MM0001'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Log In with Your Credentials</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  You can now log in using your <strong className="text-slate-900 font-bold">Rider ID</strong> and your <strong className="text-slate-900 font-bold">4-digit MPIN</strong>.
                </p>
              </div>
            </div>

            {/* Action CTA: Continue to Login */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setLoginRiderId(registeredRiderId || rider.Rider_ID || '');
                  setLoginMpin('');
                  setLoginError('');
                  setStep('signin');
                }}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/25 border border-primary ring-2 ring-primary/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>Continue to Login</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Click above to proceed to the Minnit rider sign-in screen.
              </p>
            </div>
          </div>
        )}

        {/* ── SCREEN: REJECTED RIDER FLOW ── */}
        {step === 'rejected' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-6 animate-fade-in">
            <div className="flex flex-col items-center text-center mt-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-[11px] font-black uppercase px-3.5 py-1 rounded-full border border-rose-200 mb-2">
                <span>Verification Not Approved</span>
              </div>

              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Application Not Approved
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 max-w-[280px] leading-relaxed">
                Your Minnit Rider registration could not be approved at this time.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/90 my-auto space-y-3.5">
              {rejectionReason && (
                <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Notice from Admin Team</p>
                  <p className="text-xs font-semibold text-rose-800 mt-0.5 leading-relaxed">{rejectionReason}</p>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Please contact the Minnit Admin Support team for further assistance or to update your submitted identification documents.
              </p>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Helpline:</span>
                  <a href="tel:+918000012345" className="text-slate-900 font-mono font-bold hover:underline">+91 80000 12345</a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Support Email:</span>
                  <a href="mailto:riders@minnit.in" className="text-primary font-bold hover:underline">riders@minnit.in</a>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoginRiderId('');
                setLoginMpin('');
                setLoginError('');
                setStep('signin');
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* FORGOT MPIN MODAL */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-scale-up relative">
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">Forgot your MPIN?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Direct SMS OTP reset will be configured soon. For now, please contact Minnit Rider Support to reset your MPIN.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Helpline:</span>
                  <span className="text-slate-900 font-mono font-bold">+91 80000 12345</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Support Email:</span>
                  <span className="text-primary font-bold">riders@minnit.in</span>
                </div>
              </div>

              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        )}


      </div>
    </AppShell>
  );
}
