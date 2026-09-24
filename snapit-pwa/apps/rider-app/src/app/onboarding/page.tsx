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
  Zap,
  Bike,
  Info,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
    setOnlineStatus,
  } = useRider();
  const [step, setStep] = useState<
    'splash' | 'signin' | 'personal' | 'selfie' | 'vehicle' | 'payout' | 'kyc' | 'zone' | 'reg_waiting' | 'approved' | 'rejected' | 'reg_success' | 'status'
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

  // Step 1: Personal Details
  const [fullName, setFullName] = useState(rider.name || '');
  const [dob, setDob] = useState(rider.dob || '');
  const [dobError, setDobError] = useState('');
  const [phone, setPhone] = useState(rider.phone || '');
  const [confirmPhone, setConfirmPhone] = useState(rider.phone || '');
  const [personalError, setPersonalError] = useState('');

  // Residential Address breakdown
  const [addressStreet, setAddressStreet] = useState(rider.addressStreet || '');
  const [addressArea, setAddressArea] = useState(rider.addressArea || '');
  const [addressCity, setAddressCity] = useState(rider.addressCity || 'KGF');
  const [addressPincode, setAddressPincode] = useState(rider.addressPincode || '');

  // MPIN Setup
  const [createMpin, setCreateMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [showRegMpin, setShowRegMpin] = useState(false);

  // Aadhaar Details (Collected in Step 1)
  const [aadhaarNumber, setAadhaarNumber] = useState(rider.aadhaarNumber || '');
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState(rider.aadhaarDoc || '');

  // Step 2: Live Selfie
  const [capturedSelfie, setCapturedSelfie] = useState<string>(rider.selfieCapturedUrl || '');

  // Step 3: Vehicle Details
  const [hasDrivingLicense, setHasDrivingLicense] = useState<boolean>(rider.hasDrivingLicense ?? true);
  const [vehicleType, setVehicleType] = useState(rider.vehicleType || 'Motorcycle');
  const [vehicleModel, setVehicleModel] = useState(rider.vehicleModel || '');
  const [vehicleNumber, setVehicleNumber] = useState(rider.vehicleNumber || '');
  const [dlNumber, setDlNumber] = useState(rider.dlNumber || '');
  const [dlDocUrl, setDlDocUrl] = useState(rider.dlDoc || '');
  const [vehicleError, setVehicleError] = useState('');

  // Step 4: Payout Settlement & Tax Details
  const [panNumber, setPanNumber] = useState(rider.panNumber || '');
  const [payoutMode, setPayoutMode] = useState<'UPI' | 'BANK'>(rider.payoutMode || 'UPI');
  const [upiId, setUpiId] = useState(rider.upiId || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(rider.bankAccountHolder || '');
  const [bankAccountNo, setBankAccountNo] = useState(rider.bankAccountNo || '');
  const [bankIfsc, setBankIfsc] = useState(rider.bankIfsc || '');
  const [bankPassbookDocUrl, setBankPassbookDocUrl] = useState(rider.bankPassbookDoc || '');
  const [payoutError, setPayoutError] = useState('');

  // Step 5: Preferred Operating Zone
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

  // Age calculation helper (in completed years)
  const calculateAge = (birthDateString: string): number => {
    if (!birthDateString) return 0;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDobChange = (val: string) => {
    setDob(val);
    if (val) {
      const age = calculateAge(val);
      if (age < 16) {
        setDobError('Riders must be at least 16 years of age to register.');
      } else {
        setDobError('');
      }
    } else {
      setDobError('');
    }
  };

  // Validate Step 1: Personal Details
  const handlePersonalSubmit = () => {
    setPersonalError('');
    setDobError('');

    if (!fullName.trim()) {
      setPersonalError('Please enter your full name as per government ID.');
      return;
    }

    if (!dob) {
      setPersonalError('Please select your Date of Birth.');
      return;
    }

    const age = calculateAge(dob);
    if (age < 16) {
      setPersonalError('Riders must be at least 16 years of age to register.');
      setDobError('Riders must be at least 16 years of age to register.');
      return;
    }

    const cleanPhone1 = phone.replace(/[^0-9]/g, '');
    const cleanPhone2 = confirmPhone.replace(/[^0-9]/g, '');

    if (!cleanPhone1 || cleanPhone1.length < 10) {
      setPersonalError('Please enter a valid 10-digit primary mobile number.');
      return;
    }

    if (cleanPhone1 !== cleanPhone2) {
      setPersonalError('Phone numbers do not match! Please verify the confirmation number.');
      return;
    }

    if (!addressStreet.trim()) {
      setPersonalError('Please enter your house/flat number and street name.');
      return;
    }

    if (!addressArea.trim()) {
      setPersonalError('Please enter your area or locality.');
      return;
    }

    if (!addressCity.trim()) {
      setPersonalError('Please enter your city.');
      return;
    }

    const cleanPincode = addressPincode.replace(/[^0-9]/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      setPersonalError('Please enter a valid 6-digit pincode.');
      return;
    }

    if (!createMpin || createMpin.length < 4) {
      setPersonalError('Please create a 4-digit login MPIN.');
      return;
    }

    if (createMpin !== confirmMpin) {
      setPersonalError('Create MPIN and Confirm MPIN do not match!');
      return;
    }

    const cleanAadhaar = aadhaarNumber.replace(/[^0-9]/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      setPersonalError('Please enter a valid 12-digit Aadhaar Card number.');
      return;
    }

    const fullAddress = `${addressStreet.trim()}, ${addressArea.trim()}, ${addressCity.trim()} - ${cleanPincode}`;

    updateRiderProfile({
      name: fullName,
      dob,
      phone: cleanPhone1,
      address: fullAddress,
      addressStreet: addressStreet.trim(),
      addressArea: addressArea.trim(),
      addressCity: addressCity.trim(),
      addressPincode: cleanPincode,
      mpin: createMpin,
      aadhaarNumber: cleanAadhaar,
      aadhaarDoc: aadhaarDocUrl || undefined,
    });

    setStep('selfie');
  };

  // Validate Step 3: Vehicle Details
  const handleVehicleSubmit = () => {
    setVehicleError('');

    if (hasDrivingLicense) {
      if (!vehicleNumber.trim()) {
        setVehicleError('Please enter your vehicle registration number (e.g. KA 08 EJ 1234).');
        return;
      }

      if (!dlNumber.trim()) {
        setVehicleError('Please enter your Driving Licence (DL) number.');
        return;
      }

      updateRiderProfile({
        hasDrivingLicense: true,
        vehicleType,
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        dlNumber: dlNumber.toUpperCase().trim(),
        dlDoc: dlDocUrl || undefined,
      });
    } else {
      if (!vehicleModel.trim()) {
        setVehicleError('Please select or enter your low-speed electric vehicle model.');
        return;
      }

      const numStr = vehicleNumber.trim().toUpperCase() || 'EXEMPT-EV';

      updateRiderProfile({
        hasDrivingLicense: false,
        vehicleType: 'Electric Scooter (Low-Speed ≤25km/h)',
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: numStr,
        dlNumber: undefined,
        dlDoc: undefined,
      });
    }

    setStep('payout');
  };

  // Validate Step 4: Payout Settlement & Tax (PAN)
  const handlePayoutSubmit = () => {
    setPayoutError('');

    const cleanPan = panNumber.trim().toUpperCase();
    if (!cleanPan || cleanPan.length !== 10) {
      setPayoutError('Please enter a valid 10-character alphanumeric PAN Card Number (e.g. ABCDE1234F).');
      return;
    }

    if (payoutMode === 'UPI') {
      const cleanUpi = upiId.trim();
      if (!cleanUpi || !cleanUpi.includes('@')) {
        setPayoutError('Please enter a valid UPI ID (e.g. ravi@okaxis or 9876543210@upi).');
        return;
      }
      updateRiderProfile({
        panNumber: cleanPan,
        payoutMode: 'UPI',
        upiId: cleanUpi,
      });
    } else {
      if (!bankAccountHolder.trim()) {
        setPayoutError('Please enter the Account Holder Name as shown in Bank Passbook.');
        return;
      }
      const cleanAcc = bankAccountNo.replace(/[^0-9]/g, '');
      if (!cleanAcc || cleanAcc.length < 9 || cleanAcc.length > 18) {
        setPayoutError('Please enter a valid 9 to 18 digits bank account number.');
        return;
      }
      const cleanIfsc = bankIfsc.trim().toUpperCase();
      if (!cleanIfsc || cleanIfsc.length !== 11) {
        setPayoutError('Please enter a valid 11-character IFSC Code (e.g. SBIN0001234).');
        return;
      }
      updateRiderProfile({
        panNumber: cleanPan,
        payoutMode: 'BANK',
        bankAccountHolder: bankAccountHolder.trim(),
        bankAccountNo: cleanAcc,
        bankIfsc: cleanIfsc,
        bankPassbookDoc: bankPassbookDocUrl || undefined,
      });
    }

    setStep('zone');
  };

  // Submit Step 5: Preferred Operating Zone
  const handleZoneSubmit = async () => {
    setRegError('');

    if (!selectedZoneId) {
      setRegError('Please select a preferred operating delivery zone.');
      return;
    }

    setIsSubmittingReg(true);
    const matchedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
    const cleanPhone1 = phone.replace(/[^0-9]/g, '');

    const resolvedVehicleType = hasDrivingLicense
      ? vehicleType
      : 'Electric Scooter (Low-Speed ≤25km/h)';

    const resolvedVehicleNumber = hasDrivingLicense
      ? vehicleNumber.toUpperCase().trim()
      : (vehicleNumber.trim().toUpperCase() || 'EXEMPT-EV');

    const cleanPincode = addressPincode.replace(/[^0-9]/g, '');
    const fullAddress = `${addressStreet.trim()}, ${addressArea.trim()}, ${addressCity.trim()} - ${cleanPincode}`;

    const cleanAccNo = bankAccountNo.replace(/[^0-9]/g, '');
    const cleanIfscCode = bankIfsc.trim().toUpperCase();

    const result = await registerRider({
      name: fullName,
      phone: cleanPhone1,
      mpin: createMpin,
      dob,
      hasDrivingLicense,
      vehicleType: resolvedVehicleType,
      vehicleModel: vehicleModel.trim(),
      vehicleNumber: resolvedVehicleNumber,
      selectedZoneId: matchedZone?.id || 'zone-1',
      selectedZone: matchedZone?.name || 'Robertsonpet',
      address: fullAddress,
      addressStreet: addressStreet.trim(),
      addressArea: addressArea.trim(),
      addressCity: addressCity.trim(),
      addressPincode: cleanPincode,
      aadhaarNumber: aadhaarNumber.replace(/[^0-9]/g, ''),
      aadhaarDocUrl,
      panNumber: panNumber.trim().toUpperCase(),
      dlNumber: hasDrivingLicense ? dlNumber.trim().toUpperCase() : undefined,
      dlDocUrl: hasDrivingLicense ? dlDocUrl : undefined,
      payoutMode,
      upiId: payoutMode === 'UPI' ? upiId.trim() : (cleanAccNo ? `bank:${cleanAccNo}` : `${cleanPhone1}@upi`),
      bankAccountHolder: bankAccountHolder.trim(),
      bankAccountNo: cleanAccNo,
      bankIfsc: cleanIfscCode,
      bankPassbookDocUrl: bankPassbookDocUrl || undefined,
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
      <div className="min-h-screen bg-background flex flex-col justify-between relative overflow-hidden p-5">
        
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

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 'personal' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3">
                <button
                  type="button"
                  onClick={() => setStep('signin')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 1 of 5: Personal Details
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Personal Information</h1>
              <p className="text-xs text-secondary mt-0.5">
                Fill in your basic information, residential address, and Aadhaar card.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-1/5" />
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

              {/* Date of Birth (DOB) - 16+ Validation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Date of Birth (DOB)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className={`w-full bg-white border rounded-xl p-3 text-xs font-semibold text-on-surface outline-none ${
                    dobError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary'
                  }`}
                />
                {dobError && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{dobError}</span>
                  </p>
                )}
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

              {/* Confirm Phone Number */}
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

              {/* Residential Address Fields */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Residential Address
                </label>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-secondary block">Flat / House No., Street Address *</span>
                  <input
                    type="text"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="e.g. No. 42, 3rd Cross Street"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-secondary block">Area / Locality *</span>
                  <input
                    type="text"
                    value={addressArea}
                    onChange={(e) => setAddressArea(e.target.value)}
                    placeholder="e.g. Robertsonpet, Marikuppam"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-secondary block">City *</span>
                    <input
                      type="text"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      placeholder="e.g. KGF"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-secondary block">Pincode *</span>
                    <input
                      type="tel"
                      maxLength={6}
                      value={addressPincode}
                      onChange={(e) => setAddressPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="e.g. 563122"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-semibold text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* ── AADHAAR CARD DETAILS & UPLOAD ── */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Aadhaar Card Verification</span>
                  </label>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Mandatory
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-secondary block">
                    12-Digit Aadhaar Number <span className="text-primary">*</span>
                  </span>
                  <input
                    type="tel"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                    placeholder="e.g. 1234 5678 9012"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary tracking-wider"
                  />
                </div>

                <DocumentUploadCard
                  title="Aadhaar Card Document"
                  subtitle="Front & Back scan/photo (JPG/PNG/PDF)"
                  documentType="aadhaar"
                  onFileUploaded={(url) => setAadhaarDocUrl(url)}
                  required={true}
                />
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

              {/* Validation alert */}
              {personalError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{personalError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePersonalSubmit}
              className="w-full py-4 bg-primary text-white font-bold text-xs rounded-2xl shadow-lift hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                  type="button"
                  onClick={() => setStep('personal')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 2 of 5: Live Selfie
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Capture Live Photo</h1>
              <p className="text-xs text-secondary mt-0.5">
                Take a clear front-facing selfie for rider badge and instant facial ID verification.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-2/5" />
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
              type="button"
              onClick={() => {
                if (!capturedSelfie) {
                  const sample =
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
                  setCapturedSelfie(sample);
                  updateRiderProfile({ selfieCapturedUrl: sample, avatarUrl: sample });
                }
                setStep('vehicle');
              }}
              className="w-full py-4 bg-primary text-white font-bold text-xs rounded-2xl shadow-lift hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Vehicle Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: DEDICATED VEHICLE DETAILS & LICENCE CATEGORY */}
        {step === 'vehicle' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3">
                <button
                  type="button"
                  onClick={() => setStep('selfie')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 3 of 5: Vehicle Details
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Vehicle & Licence Details</h1>
              <p className="text-xs text-secondary mt-0.5">
                Select your vehicle type and licensing category.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-3/5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
              {/* Question: Do you have a Driving Licence? */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Do you have a Driving Licence (DL)?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setHasDrivingLicense(true);
                      setVehicleError('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      hasDrivingLicense
                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        hasDrivingLicense ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <FileCheck className="w-4 h-4" />
                      </div>
                      {hasDrivingLicense && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-xs font-bold text-slate-900">I have a DL</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Petrol bikes & high-speed EVs
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasDrivingLicense(false);
                      setVehicleError('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      !hasDrivingLicense
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        !hasDrivingLicense ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      {!hasDrivingLicense && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs font-bold text-slate-900">No DL Needed</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Low-speed EV (≤25km/h)
                    </p>
                  </button>
                </div>
              </div>

              {/* Conditional Form based on DL status */}
              {hasDrivingLicense ? (
                <div className="space-y-3.5 animate-fade-in pt-1">
                  {/* Vehicle Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">Vehicle Type</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                    >
                      <option value="Motorcycle">Motorcycle (Petrol / Geared)</option>
                      <option value="Scooter">Scooter (Petrol / Non-Geared)</option>
                      <option value="Electric Scooter (High-Speed)">Electric Scooter (High-Speed RTO)</option>
                    </select>
                  </div>

                  {/* Vehicle Model Name with suggestions */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface">Vehicle Model</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Honda Activa 6G, Hero Splendor, Ola S1"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {['Honda Activa', 'Hero Splendor', 'Bajaj Pulsar', 'TVS Jupiter', 'Ola S1', 'Ather 450X'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setVehicleModel(m)}
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            vehicleModel === m
                              ? 'bg-primary text-white border-primary'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Number Plate */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">
                      Vehicle Registration Number <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="KA 08 EJ 1234"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary uppercase tracking-wider"
                    />
                  </div>

                  {/* DL Number Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">
                      Driving Licence (DL) Number <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={dlNumber}
                      onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. KA08 20210001234"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary uppercase tracking-wider"
                    />
                  </div>

                  {/* DL Document Upload */}
                  <div className="space-y-1.5">
                    <DocumentUploadCard
                      title="Driving Licence (DL) Document"
                      subtitle="Front & Back scan/photo (JPG/PNG/PDF)"
                      documentType="dl"
                      onFileUploaded={(url) => setDlDocUrl(url)}
                      required={true}
                    />
                  </div>
                </div>
              ) : (
                /* Non-DL Branch */
                <div className="space-y-3.5 animate-fade-in pt-1">
                  {/* Legal Compliance Box with MoRTH Official Link */}
                  <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-2xl p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Legal Exemption Notice (CMVR Rule 2(u))</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Under the Central Motor Vehicles Rules (CMVR), electric two-wheelers with a maximum speed ≤ 25 km/h & motor power ≤ 250W are classified as non-motor vehicles. They are <strong>legally exempt</strong> from Driving Licence and RTO registration plate requirements.
                    </p>
                    <a
                      href="https://morth.nic.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline decoration-emerald-400 hover:decoration-emerald-700 cursor-pointer"
                    >
                      <span>View Official MoRTH Guidelines (CMVR Rule 2(u))</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>

                  {/* Low-Speed EV Model Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface">
                      Low-Speed EV Model / Brand <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Hero Electric Flash, Okinawa Lite"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-emerald-600"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {['Hero Electric Flash', 'Hero Electric NYX', 'Ampere Reo', 'Okinawa Lite', 'Komaki XGT VP'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setVehicleModel(m)}
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            vehicleModel === m
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Number Plate Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">
                      Vehicle Number Plate
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. KA 08 EJ 1234"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-on-surface outline-none focus:border-emerald-600 uppercase tracking-wider"
                    />
                  </div>
                </div>
              )}

              {vehicleError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{vehicleError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleVehicleSubmit}
              className="w-full py-4 bg-primary text-white font-bold text-xs rounded-2xl shadow-lift hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Payout Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: PAYOUT SETTLEMENT & TAX (PAN) */}
        {step === 'payout' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3">
                <button
                  type="button"
                  onClick={() => setStep('vehicle')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 4 of 5: Payout Settlement
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Payout Settlement</h1>
              <p className="text-xs text-secondary mt-0.5">
                Enter your PAN number and choose your preferred earnings cashout method.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-4/5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
              {/* ── PAN CARD DETAILS (OUTSIDE TOGGLE, MANDATORY, NO UPLOAD) ── */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    <span>Permanent Account Number (PAN)</span>
                  </label>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Required for Tax
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    PAN Card Number <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-primary focus:bg-white uppercase tracking-wider"
                  />
                  <p className="text-[10px] text-slate-400">
                    10-character alphanumeric PAN for TDS compliance and weekly payout processing. No document upload required.
                  </p>
                </div>
              </div>

              {/* ── PAYOUT METHOD TOGGLE (UPI VS BANK) ── */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Select Payout Method</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Direct Settlement
                  </span>
                </div>

                {/* Tab switcher: UPI vs Bank */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setPayoutMode('UPI')}
                    className={`flex-1 py-2.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      payoutMode === 'UPI'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    UPI ID (Instant)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMode('BANK')}
                    className={`flex-1 py-2.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      payoutMode === 'BANK'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bank Account
                  </button>
                </div>

                {payoutMode === 'UPI' ? (
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      UPI ID for Cashout <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                      placeholder="e.g. ravi@okaxis or 9876543210@upi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-400">
                      Deliveries and weekly bonuses are credited directly to this UPI ID.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Account Holder Name <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankAccountHolder}
                        onChange={(e) => setBankAccountHolder(e.target.value)}
                        placeholder="As shown in Bank Passbook"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Bank Account Number <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankAccountNo}
                        onChange={(e) => setBankAccountNo(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="9 to 18 digits account number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        IFSC Code <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={11}
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0001234"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white uppercase tracking-wider"
                      />
                    </div>

                    {/* Optional Bank Passbook / Cheque photo upload */}
                    <div className="space-y-1.5 pt-1">
                      <DocumentUploadCard
                        title="Bank Passbook / Cheque"
                        subtitle="Photo of passbook or cheque (Optional)"
                        documentType="bank"
                        onFileUploaded={(url) => setBankPassbookDocUrl(url)}
                      />
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Direct NEFT/IMPS earnings settlement to your bank account.
                    </p>
                  </div>
                )}
              </div>

              {payoutError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payoutError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePayoutSubmit}
              className="w-full py-4 bg-primary text-white font-bold text-xs rounded-2xl shadow-lift hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Select Preferred Zone</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 5: SELECT YOUR PREFERRED OPERATING ZONE */}
        {step === 'zone' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3">
                <button
                  type="button"
                  onClick={() => setStep('payout')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 5 of 5: Select Preferred Zone
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Select Your Preferred Zone</h1>
              <p className="text-xs text-secondary mt-0.5">
                Choose the primary delivery zone where you want to accept orders.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-full" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3">
              {/* Short and simple selectable option for 2 active zones */}
              {[
                {
                  id: 'zone-1',
                  name: 'Robertsonpet Zone',
                  coverage: '5km Hub Coverage',
                  demand: 'High Demand',
                  earnings: '₹800 - ₹1,200/day',
                },
                {
                  id: 'zone-3',
                  name: 'BEML Zone',
                  coverage: '5km Sub-Hub Coverage',
                  demand: 'Steady Demand',
                  earnings: '₹550 - ₹850/day',
                },
              ].map((z) => {
                const isSelected = selectedZoneId === z.id;
                return (
                  <div
                    key={z.id}
                    onClick={() => setSelectedZoneId(z.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-primary/5 border-primary ring-1 ring-primary shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">{z.name}</h3>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              {z.demand}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{z.coverage} • Est. {z.earnings}</p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs'
                            : 'border-2 border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Informative note */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  You can always switch your operating zone later from Rider Settings based on active order demand.
                </span>
              </div>

              {regError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
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
        {(step === 'reg_waiting' || step === 'reg_success' || step === 'status') ? (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-6 animate-fade-in">
            <div className="flex flex-col items-center text-center mt-3">
              {/* Radar pulse status icon */}
              <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping opacity-75" />
                <div className="relative z-10 w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 text-white">
                  <Hourglass className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-black uppercase px-4 py-1.5 rounded-full border border-amber-200 mb-3 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Verification Pending</span>
              </div>

              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Registration Submitted
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 max-w-[290px] leading-relaxed">
                Your profile is currently under review by the Minnit Admin Team. You will receive an SMS update once your registration is approved.
              </p>
            </div>

            {/* Clean Verification Status Tracker Card (Row by Row) */}
            <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/90 my-auto text-left space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-none">Application Status</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Live verification progress</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Under Review
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {/* 1. Selfie Uploaded */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">Selfie Uploaded</p>
                      <p className="text-[10px] text-slate-500">Live facial photo submitted</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                    Completed
                  </span>
                </div>

                {/* 2. Vehicle Details */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">Vehicle Details</p>
                      <p className="text-[10px] text-slate-500">Model & registration recorded</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                    Completed
                  </span>
                </div>

                {/* 3. KYC Documents */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">KYC Documents</p>
                      <p className="text-[10px] text-slate-500">Aadhaar & PAN entered</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                    Completed
                  </span>
                </div>

                {/* 4. Admin Review */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50 border border-amber-300/80 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                      <Hourglass className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-950 leading-tight">Admin Review</p>
                      <p className="text-[10px] text-amber-800">Verification in progress</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md shrink-0 animate-pulse">
                    In Progress
                  </span>
                </div>
              </div>
            </div>

            {/* Explore Rider UI Action Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('minnit_active_shift_session');
                    localStorage.removeItem('snapit_online_status_v2');
                    localStorage.removeItem('snapit_active_order_v2');
                    localStorage.removeItem('snapit_incoming_order_v2');
                    localStorage.removeItem('snapit_earnings_v2');
                    localStorage.removeItem('snapit_orders_history_v2');
                    localStorage.removeItem('snapit_handled_orders_v2');
                    localStorage.removeItem('snapit_cancelled_orders_v2');
                    localStorage.removeItem('snapit_rider_break_v1');
                  } catch {}

                  setOnlineStatus(false);
                  updateRiderProfile({
                    isAuthenticated: true,
                    isVerified: false,
                    verificationStatus: 'PENDING',
                    walletBalance: 0,
                    totalDeliveries: 0,
                  });
                  router.push('/');
                }}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-lift hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Explore Rider UI</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-tight">
                Preview the delivery dashboard and features while awaiting admin activation.
              </p>
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
