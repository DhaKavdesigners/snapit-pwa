import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Package, MapPin, CreditCard, HelpCircle, LogOut, Navigation, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type RegistrationStep = 'form' | 'otp' | 'success' | 'dashboard';

export const ProfileView: React.FC = () => {
  const [step, setStep] = useState<RegistrationStep>('form');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    confirmPhone: '',
    address: '',
    landmark: '',
    pincode: ''
  });
  const [otp, setOtp] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Basic validation just to enable the button
  const isFormValid = formData.name && formData.phone.length === 10 && formData.phone === formData.confirmPhone && formData.address && formData.pincode;
  const isOtpValid = otp.length === 6;

  const renderForm = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="text-center mb-8">
        <h2 className="font-black text-2xl text-text-primary mb-1 tracking-tight">Profile Registration</h2>
        <p className="text-text-secondary text-sm">Create your SnapIt account</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Customer Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all shadow-sm font-medium" />
        </div>

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Phone Number *</label>
          <div className="flex bg-white rounded-xl border border-gray-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 overflow-hidden shadow-sm transition-all">
            <span className="px-3 py-3 bg-gray-50 border-r border-gray-200 font-bold text-text-primary">+91</span>
            <input type="tel" name="phone" maxLength={10} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} placeholder="10-digit mobile" className="flex-1 px-3 py-3 outline-none font-bold tracking-wide" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Confirm Phone Number *</label>
          <input type="tel" name="confirmPhone" maxLength={10} value={formData.confirmPhone} onChange={(e) => setFormData({...formData, confirmPhone: e.target.value.replace(/\D/g, '')})} placeholder="Re-enter mobile number" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all shadow-sm font-bold tracking-wide" />
        </div>

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Address Details *</label>
          <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="House No, Building Name" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all shadow-sm font-medium" />
        </div>

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Landmark *</label>
          <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="E.g., Near temple" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all shadow-sm font-medium" />
        </div>

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">PIN Code *</label>
          <input type="tel" name="pincode" maxLength={6} value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} placeholder="E.g., 563122" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all shadow-sm font-bold tracking-widest" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200/50">
        <Navigation className="w-4 h-4" />
        <span className="text-sm font-bold">Live GPS Locked</span>
      </div>

      <p className="text-center text-xs text-text-secondary px-4 mt-6">
        Submit your details to register and verify your profile for instant future orders.
      </p>

      <Button 
        disabled={!isFormValid}
        onClick={() => setStep('otp')}
        className="w-full h-14 mt-4 text-sm font-bold shadow-[0_8px_16px_rgba(4,107,53,0.25)] hover:scale-[1.02] transition-transform uppercase tracking-wider"
      >
        Get Verification Code
      </Button>
    </motion.div>
  );

  const renderOtp = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full items-center py-10"
    >
      <div className="text-center mb-10 w-full">
        <h2 className="font-black text-2xl text-text-primary mb-2 tracking-tight">Delivery Verification Code</h2>
        <p className="text-text-secondary text-sm">Enter the code below to confirm your identity</p>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/60 border border-gray-100 w-full mb-10">
        <div className="flex justify-between items-center mb-6">
           <span className="text-sm font-medium text-text-secondary">Demo Code:</span>
           <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-500">679527 Copy</span>
        </div>
        
        <label className="text-xs font-bold text-brand uppercase tracking-wider mb-2 block text-center">Enter Code to Confirm</label>
        <input 
          type="tel" 
          maxLength={6} 
          value={otp} 
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all shadow-inner" 
          autoFocus
        />
      </div>

      <Button 
        disabled={!isOtpValid}
        onClick={() => setStep('success')}
        className="w-full h-14 text-sm font-bold shadow-[0_8px_16px_rgba(4,107,53,0.3)] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform uppercase tracking-wider mb-4"
      >
        Confirm Code <ArrowRight className="w-4 h-4" />
      </Button>

      <button className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors mb-6">
        RESEND
      </button>
      
      <button onClick={() => setStep('form')} className="text-sm font-bold text-brand hover:text-brand/80 transition-colors mt-auto">
        ← Change Number
      </button>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 bg-brand/20 rounded-full animate-ping"></div>
        <CheckCircle2 className="w-12 h-12 text-brand relative z-10" />
      </div>
      
      <h2 className="font-black text-3xl text-text-primary mb-4 tracking-tight">Profile Registered! 🎉</h2>
      <p className="text-text-secondary text-base mb-8 px-4 leading-relaxed">
        Your profile details are verified and saved. You can now build your tray and checkout instantly.
      </p>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full mb-10 text-left">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Registered Phone</p>
        <p className="font-mono text-xl font-bold tracking-widest text-text-primary mb-4">{formData.phone}</p>
        <div className="flex items-center gap-2 text-brand font-bold bg-brand/5 w-fit px-3 py-1.5 rounded-lg border border-brand/10">
          Status: Verified ✅
        </div>
      </div>

      <Button 
        onClick={() => setStep('dashboard')}
        className="w-full h-14 text-sm font-bold shadow-[0_8px_16px_rgba(4,107,53,0.3)] hover:scale-[1.02] transition-transform uppercase tracking-wider"
      >
        Back to Menu
      </Button>
    </motion.div>
  );

  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
      {/* User Header */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center text-2xl font-bold">
          {formData.name.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="font-bold text-xl text-text-primary">{formData.name || 'User'}</h2>
          <p className="text-text-secondary text-sm font-medium">+91 {formData.phone}</p>
        </div>
      </div>
      
      {/* Settings Options */}
      <div className="bg-white rounded-3xl p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-6">
        <ul className="flex flex-col">
          <li className="flex items-center gap-4 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer rounded-t-2xl">
            <Package className="h-6 w-6 text-brand/70" />
            <span className="font-bold text-text-primary">My Orders</span>
          </li>
          <li className="flex items-center gap-4 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
            <MapPin className="h-6 w-6 text-brand/70" />
            <span className="font-bold text-text-primary">Saved Addresses</span>
          </li>
          <li className="flex items-center gap-4 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
            <CreditCard className="h-6 w-6 text-brand/70" />
            <span className="font-bold text-text-primary">Payment Methods</span>
          </li>
          <li className="flex items-center gap-4 p-4 active:bg-gray-50 transition-colors cursor-pointer rounded-b-2xl">
            <HelpCircle className="h-6 w-6 text-brand/70" />
            <span className="font-bold text-text-primary">Help & Support</span>
          </li>
        </ul>
      </div>
      
      {/* Log Out */}
      <div className="px-2 mt-auto">
        <button 
          onClick={() => setStep('form')}
          className="flex items-center justify-center gap-2 w-full py-4 text-red-500 font-bold active:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 pt-8 pb-32 h-full overflow-y-auto bg-gray-50">
      <AnimatePresence mode="wait">
        {step === 'form' && <React.Fragment key="form">{renderForm()}</React.Fragment>}
        {step === 'otp' && <React.Fragment key="otp">{renderOtp()}</React.Fragment>}
        {step === 'success' && <React.Fragment key="success">{renderSuccess()}</React.Fragment>}
        {step === 'dashboard' && <React.Fragment key="dashboard">{renderDashboard()}</React.Fragment>}
      </AnimatePresence>
    </div>
  );
};
