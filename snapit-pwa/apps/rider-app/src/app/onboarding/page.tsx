'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { rider, zones, updateRiderProfile, simulateApproval, registerRider, loginWithMpin, loginWithMpinOnly } = useRider();
  const [step, setStep] = useState<'splash' | 'signin' | 'selfie' | 'personal' | 'kyc' | 'zone' | 'status'>('splash');
  
  // Login form state
  const [loginMpin, setLoginMpin] = useState('');
  const [showLoginMpin, setShowLoginMpin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

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

  // Handle Login with MPIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginMpin || loginMpin.length < 4) {
      setLoginError('Please enter your 4-digit MPIN.');
      return;
    }

    setIsLoggingIn(true);
    const result = await loginWithMpinOnly(loginMpin);
    setIsLoggingIn(false);

    if (!result.success) {
      setLoginError(result.error || 'Incorrect MPIN. Please try again.');
      return;
    }

    router.push('/');
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

  // Submit Zone & complete instant approval
  const handleZoneSubmit = async () => {
    const matchedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
    const cleanPhone1 = phone.replace(/[^0-9]/g, '');

    await registerRider({
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

    router.push('/');
  };

  // Admin Approval Simulator
  const handleSimulateApprove = () => {
    simulateApproval();
    router.push('/');
  };

  return (
    <AppShell showHeader={false} showNav={false} noPadding={true}>
      <div className="min-h-screen bg-background flex flex-col justify-between p-5 relative overflow-hidden">
        
        {/* SCREEN 1: SPLASH SCREEN (CLEAN LOGO WITHOUT BORDER CONTAINER) */}
        {step === 'splash' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-scale-up">
            {/* Clean logo without border/box container */}
            <div className="relative mb-6">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPs4EKMmSJfF7OZSE5QvxHYkaQaxGyznsl93usjdUGjJQphBYmThXZMDlfS1l8AwYuPWUE4qX0gkE60fAGllfy4wdkfrujyUY85wKfg-mGJ3BwDvRKDqgrbSzaIDDAhc-esOo7mJ_0USaxHKVhpPBU79y5XhxKAxASCLi60ie3f9_23-SZGoV-pJDoCqpgzO2PqNh5bAq0lpS5HV1lLgCgErhB8Yj9IGvQA2_5IOHspw03F6vxeh86gSeNslB-03KgMW4"
                alt="Snapit Logo"
                className="w-32 h-32 object-contain animate-pulse-soft filter drop-shadow-md"
              />
            </div>

            <h1 className="text-3xl font-black text-on-surface tracking-tight mb-2">
              Welcome to <span className="text-primary">Snapit</span>
            </h1>
            <p className="text-sm font-medium text-secondary mb-8">
              Deliver smarter. Earn better.
            </p>

            <button
              onClick={() => setStep('signin')}
              className="w-full max-w-xs py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm rounded-2xl shadow-lift hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN 2: SIGN-IN */}
        {step === 'signin' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-8 animate-fade-in">
            <button
              onClick={() => setStep('splash')}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>

            <div className="flex flex-col items-center text-center my-auto">
              {/* Clean logo without border */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3o2HLR5AwM4kEN-GFzCeYN6ugvib12tBSzgQvSssqWepsW5UG1Mk1n26XeuZkEgFYBOqco542A-bidGKq_qBnAEiiR4U0rzTE4hdThRqoxGnsYG2W46yjEK4XRS204lXuY77EI-IbL01aB6B8hlGEx-PA4EbyQrdhFackL14_ky7P8WfFpApftaUsjlUntFDyD_DCK7-AhicpaOlG5L0VI_tHbbyJc6-y1NAdCZw9Pm-efJEL3jJsFdg-hnzSs_xclPg"
                alt="Snapit Rider"
                className="w-24 h-24 object-contain mb-5"
              />

              <h2 className="text-2xl font-black text-on-surface mb-1.5">
                Sign in to your account
              </h2>
              <p className="text-xs text-secondary mb-4">
                Start delivering in your city today
              </p>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="w-full bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 space-y-4 text-left mb-3">
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

                {loginError && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-200 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn || loginMpin.length < 4}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-xl shadow-lift hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoggingIn ? 'Logging in...' : 'Login with MPIN'}</span>
                </button>
              </form>

              {/* Register Profile Option */}
              <div className="w-full text-center">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">New to Snapit?</span>
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
              By continuing, you agree to Snapit&apos;s{' '}
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

            <button
              onClick={handleZoneSubmit}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-2xl shadow-lift hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Submit Application for Approval</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 5: VERIFICATION APPROVAL STATUS TRACKER (STRICT GUARD) */}
        {step === 'status' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div className="flex flex-col items-center text-center mt-2">
              {/* Radar pulse hourglass icon */}
              <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 rounded-full radar-ring" />
                <div className="relative z-10 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-soft border border-slate-200">
                  <Hourglass className="w-7 h-7 text-primary animate-pulse" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3.5 py-1 rounded-full text-[11px] font-bold border border-amber-200 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Status: Under Review</span>
              </div>

              <h1 className="text-xl font-black text-on-surface">
                Application Submitted!
              </h1>
              <p className="text-xs text-secondary mt-1 max-w-[280px]">
                Your selfie, Aadhaar, PAN, and DL are currently being verified by the Snapit onboarding team.
              </p>
            </div>

            {/* Live Progress Tracker */}
            <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 my-3">
              <h3 className="font-bold text-xs text-on-surface mb-3.5 flex items-center justify-between">
                <span>Verification Queue</span>
                <span className="text-[10px] text-primary font-mono font-bold">Est: ~5 mins</span>
              </h3>

              <div className="relative pl-5 space-y-4 text-xs">
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-200" />

                <div className="flex items-start gap-3 relative">
                  <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] -ml-[23px] shrink-0 shadow-sm">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface leading-tight">Live Selfie & Profile Form</p>
                    <p className="text-[10px] text-secondary">Verified face match</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 relative">
                  <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] -ml-[23px] shrink-0 shadow-sm">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface leading-tight">Aadhaar & PAN Scans</p>
                    <p className="text-[10px] text-secondary">Government database matched</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 relative">
                  <div className="w-4 h-4 rounded-full bg-primary-container text-white flex items-center justify-center text-[10px] -ml-[23px] shrink-0 animate-pulse">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="font-bold text-primary leading-tight">Driving License Check</p>
                    <p className="text-[10px] text-secondary">Transport authority clearance</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 relative opacity-60">
                  <div className="w-4 h-4 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] -ml-[23px] shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-on-surface leading-tight">Admin Sign-off</p>
                    <p className="text-[10px] text-secondary">Ready to receive deliveries</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Approval Trigger (Simulate approval to unlock Dashboard) */}
            <div className="space-y-2">
              <button
                onClick={handleSimulateApprove}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-2xl shadow-lift hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simulate Admin Approval & Unlock Dashboard</span>
              </button>

              <p className="text-[10px] text-center text-secondary">
                Riders cannot open the main cockpit until approved.
              </p>
            </div>
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
                  Direct SMS OTP reset will be configured soon. For now, please contact Snapit Rider Support to reset your MPIN.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Helpline:</span>
                  <span className="text-slate-900 font-mono font-bold">+91 80000 12345</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Support Email:</span>
                  <span className="text-primary font-bold">riders@snapit.in</span>
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
