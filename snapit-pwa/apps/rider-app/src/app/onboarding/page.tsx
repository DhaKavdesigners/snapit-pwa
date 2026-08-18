'use client';

import React, { useState } from 'react';
import { useRider } from '@/context/RiderContext';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentUploadCard } from '@/components/onboarding/DocumentUploadCard';
import { ZoneSelectCard } from '@/components/onboarding/ZoneSelectCard';
import { ArrowLeft, Camera, CheckCircle2, ArrowRight, ShieldCheck, Hourglass, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingPage() {
  const { rider, zones, updateRiderProfile, simulateApproval } = useRider();
  const [step, setStep] = useState<'splash' | 'signin' | 'profile' | 'zone' | 'status'>('splash');
  const [fullName, setFullName] = useState(rider.name || 'Rahul Sharma');
  const [dob, setDob] = useState('1998-05-14');
  const [upiId, setUpiId] = useState(rider.upiId || 'rahul.k@okicici');
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || 'zone-1');
  const router = useRouter();

  const handleProfileSubmit = () => {
    updateRiderProfile({
      name: fullName,
      upiId,
    });
    setStep('zone');
  };

  const handleZoneSubmit = () => {
    const matchedZone = zones.find((z) => z.id === selectedZoneId);
    if (matchedZone) {
      updateRiderProfile({
        selectedZone: matchedZone.name,
        isVerified: false,
        verificationStep: 2,
      });
    }
    setStep('status');
  };

  const handleSimulateApprove = () => {
    simulateApproval();
    router.push('/');
  };

  return (
    <AppShell showHeader={false} showNav={false} noPadding={true}>
      <div className="min-h-screen bg-background flex flex-col justify-between p-5 relative overflow-hidden">
        
        {/* SCREEN 1: ANIMATED SPLASH */}
        {step === 'splash' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-scale-up">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-lift animate-pulse-soft">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPs4EKMmSJfF7OZSE5QvxHYkaQaxGyznsl93usjdUGjJQphBYmThXZMDlfS1l8AwYuPWUE4qX0gkE60fAGllfy4wdkfrujyUY85wKfg-mGJ3BwDvRKDqgrbSzaIDDAhc-esOo7mJ_0USaxHKVhpPBU79y5XhxKAxASCLi60ie3f9_23-SZGoV-pJDoCqpgzO2PqNh5bAq0lpS5HV1lLgCgErhB8Yj9IGvQA2_5IOHspw03F6vxeh86gSeNslB-03KgMW4"
                  alt="Snapit Logo"
                  className="w-24 h-24 object-contain"
                />
              </div>
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

        {/* SCREEN 2: GOOGLE SIGN-IN */}
        {step === 'signin' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-8 animate-fade-in">
            <button
              onClick={() => setStep('splash')}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>

            <div className="flex flex-col items-center text-center my-auto">
              <div className="w-20 h-20 rounded-2xl bg-white p-3 shadow-soft border border-slate-100 mb-5">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3o2HLR5AwM4kEN-GFzCeYN6ugvib12tBSzgQvSssqWepsW5UG1Mk1n26XeuZkEgFYBOqco542A-bidGKq_qBnAEiiR4U0rzTE4hdThRqoxGnsYG2W46yjEK4XRS204lXuY77EI-IbL01aB6B8hlGEx-PA4EbyQrdhFackL14_ky7P8WfFpApftaUsjlUntFDyD_DCK7-AhicpaOlG5L0VI_tHbbyJc6-y1NAdCZw9Pm-efJEL3jJsFdg-hnzSs_xclPg"
                  alt="Snapit Rider"
                  className="w-full h-full object-contain"
                />
              </div>

              <h2 className="text-2xl font-black text-on-surface mb-1.5">
                Sign in to your account
              </h2>
              <p className="text-xs text-secondary mb-8">
                Start delivering in your city today
              </p>

              {/* Google Button */}
              <button
                onClick={() => setStep('profile')}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 shadow-soft rounded-2xl py-3.5 px-6 hover:bg-slate-50 active:scale-98 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-xs font-bold text-on-surface">
                  Continue with Google
                </span>
              </button>
            </div>

            <p className="text-[11px] text-secondary text-center leading-relaxed">
              By continuing, you agree to Snapit's{' '}
              <a href="#" className="text-primary underline">Terms of Service</a> and{' '}
              <a href="#" className="text-primary underline">Privacy Policy</a>
            </p>
          </div>
        )}

        {/* SCREEN 3: PROFILE SETUP (STEP 1 OF 3) */}
        {step === 'profile' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            {/* Header */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setStep('signin')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 1 of 3
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Complete your profile</h1>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-1/3" />
              </div>
            </div>

            {/* Form Fields & Document Uploads */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-5 space-y-4">
              {/* Selfie capture */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-primary/40 flex items-center justify-center relative cursor-pointer hover:bg-primary/5 transition-colors">
                  <Camera className="w-7 h-7 text-primary" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                    +
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-secondary">
                  Upload a clear selfie
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-secondary">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As per official documents"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-secondary">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-secondary">UPI ID (For Instant Payouts)</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@bank"
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 pr-9 text-xs font-mono font-semibold text-on-surface outline-none focus:border-primary"
                  />
                  <CheckCircle2 className="w-4 h-4 text-primary absolute right-3" />
                </div>
              </div>

              {/* Upload Cards */}
              <div className="pt-2 space-y-2.5">
                <label className="text-xs font-bold text-on-surface block">
                  Identity Verification
                </label>
                <DocumentUploadCard
                  icon="badge"
                  title="Aadhaar Card"
                  subtitle="Front & Back (JPG or PDF)"
                />
                <DocumentUploadCard
                  icon="directions_car"
                  title="Driving License"
                  subtitle="Required for riders"
                />
              </div>
            </div>

            {/* Bottom Button */}
            <button
              onClick={handleProfileSubmit}
              className="w-full py-4 bg-primary text-white font-bold text-xs rounded-2xl shadow-lift hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Zone Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN 4: ZONE SELECTION (STEP 2 OF 3) */}
        {step === 'zone' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setStep('profile')}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 text-on-surface" />
                </button>
                <span className="text-xs font-bold text-secondary bg-slate-200/80 px-3 py-1 rounded-full">
                  Step 2 of 3
                </span>
              </div>

              <h1 className="text-xl font-black text-on-surface">Select Delivery Zone</h1>
              <p className="text-xs text-secondary mt-1">
                Choose your primary operating zone. You can switch this later.
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-2/3" />
              </div>
            </div>

            {/* Zone Cards */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-5 space-y-3">
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
              <span>Submit for Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN 5: VERIFICATION STATUS TRACKER */}
        {step === 'status' && (
          <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4 animate-fade-in">
            {/* Top Hourglass Radar Icon matching Stitch Screen 5 */}
            <div className="flex flex-col items-center text-center mt-4">
              <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 rounded-full radar-ring" />
                <div className="relative z-10 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-soft border border-slate-200">
                  <Hourglass className="w-7 h-7 text-primary animate-pulse" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[11px] font-bold border border-amber-200 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Status: Pending Review</span>
              </div>

              <h1 className="text-xl font-black text-on-surface">
                Your profile is under review
              </h1>
              <p className="text-xs text-secondary mt-1 max-w-[260px]">
                Our team is checking your uploaded documents.
              </p>
            </div>

            {/* Verification Timeline Tracker */}
            <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 my-4">
              <h3 className="font-bold text-xs text-on-surface mb-3.5">
                Verification Progress
              </h3>

              <div className="relative pl-5 space-y-4 text-xs">
                {/* Vertical tracker bar */}
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-200" />

                {/* Step 1 */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] -ml-[23px] shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface leading-tight">Profile Submitted</p>
                    <p className="text-[10px] text-secondary">All details uploaded</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-4 h-4 rounded-full bg-primary-container text-white flex items-center justify-center text-[10px] -ml-[23px] shrink-0 animate-pulse">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="font-bold text-primary leading-tight">Documents Reviewing</p>
                    <p className="text-[10px] text-secondary">Aadhaar & DL check</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 relative opacity-60">
                  <div className="w-4 h-4 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] -ml-[23px] shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-on-surface leading-tight">Admin Verification</p>
                    <p className="text-[10px] text-secondary">Background clearance</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 relative opacity-60">
                  <div className="w-4 h-4 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] -ml-[23px] shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-on-surface leading-tight">Approved</p>
                    <p className="text-[10px] text-secondary">Ready to start earning</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulate Instant Approval Trigger */}
            <div className="space-y-2">
              <button
                onClick={handleSimulateApprove}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-2xl shadow-lift hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simulate Instant Approval & Go to Dashboard</span>
              </button>

              <Link
                href="/"
                className="block text-center text-xs font-semibold text-secondary hover:text-primary py-2"
              >
                Skip to Dashboard →
              </Link>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
