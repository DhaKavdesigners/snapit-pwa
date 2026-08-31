import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { 
  Package, MapPin, LogOut, CheckCircle2, X, User, ShoppingBag, 
  MessageCircle, Info, Copy, Check, RefreshCw, ShieldCheck, 
  Sparkles, AlertCircle, Smartphone, ChefHat, Bike, Clock, 
  ArrowRight, ChevronRight, Store, FileText, ChevronDown, ChevronUp, History,
  Receipt, Printer, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/currency';

// ─── Tiny Web Audio sound engine ─────────────────────────────────────────────
type SoundType = 'success' | 'tap' | 'modal-pop' | 'sms-ping' | 'error';

const playSound = (type: SoundType) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (type === 'success') {
      // A sweet two-tone rising chime: C5 → E5 → G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
    } else if (type === 'modal-pop') {
      // Gentle buoyant opening pop
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gainNode);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'sms-ping') {
      // Authentic high-clarity incoming SMS ping chime
      const notes = [
        { freq: 1174.66, time: 0, dur: 0.14 },
        { freq: 1567.98, time: 0.07, dur: 0.4 },
      ];
      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        g.gain.setValueAtTime(0, ctx.currentTime + time);
        g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + time + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur);
      });
    } else if (type === 'error') {
      // Double subtle low buzz
      [180, 140].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.12);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.12);
      });
    } else {
      // Tactile click
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 650;
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gainNode);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch {}
};

type RegistrationStep = 'form' | 'success' | 'dashboard';

export const ProfileView: React.FC = () => {
  const { register, logout, isLoggedIn, userProfile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // If already registered, skip straight to dashboard.
  // Populate formData from persisted profile so the dashboard has the right name/phone.
  const [step, setStep] = useState<RegistrationStep>(
    isLoggedIn ? 'dashboard' : 'form'
  );
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    confirmPhone: userProfile?.phone || '',
    addressLine1: userProfile?.addressLine1 || '',
    addressLine2: userProfile?.addressLine2 || '',
    landmark: userProfile?.landmark || '',
    pincode: userProfile?.pincode || ''
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('679527');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [copied, setCopied] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [showSmsBanner, setShowSmsBanner] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Dashboard modal states
  const [aboutModal, setAboutModal] = useState(false);
  const [policyModal, setPolicyModal] = useState<null | 'privacy' | 'terms' | 'refund'>(null);
  const [ordersModal, setOrdersModal] = useState(false);
  const [ordersTab, setOrdersTab] = useState<'active' | 'history'>('active');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [billModalOrder, setBillModalOrder] = useState<any | null>(null);
  const [copiedBillId, setCopiedBillId] = useState(false);

  const formatOrderDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Recent Order';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const handleRequestBill = async (orderId: string) => {
    playSound('modal-pop');
    // First check in already loaded orders state
    const found = orders.find((o: any) => o.id === orderId);
    if (found) {
      setBillModalOrder(found);
      return;
    }
    // Fetch directly on-demand from Supabase by orderId
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (data && !error) {
        setBillModalOrder(data);
      }
    } catch (err) {
      console.warn('Error fetching order bill on-demand:', err);
    }
  };

  // Saved Addresses State
  const [addressesModal, setAddressesModal] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    title: 'Home',
    line1: '',
    line2: '',
    landmark: '',
    pincode: '563122',
  });

  const getInitialAddresses = () => {
    try {
      const stored = localStorage.getItem('minnit_saved_addresses_v1');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const primary = {
      id: 'addr-primary',
      title: 'Home (Registered)',
      line1: userProfile?.addressLine1 || formData.addressLine1 || '#450, Maariyaman temple street',
      line2: userProfile?.addressLine2 || formData.addressLine2 || 'Bowrilalpet, Robertsonpet',
      landmark: userProfile?.landmark || formData.landmark || 'Near temple',
      pincode: userProfile?.pincode || formData.pincode || '563122',
      isDefault: true,
    };

    const college = {
      id: 'addr-college',
      title: 'DTTIT College',
      line1: 'DTTIT Campus, Oorgaum Post',
      line2: 'Oorgaum',
      landmark: 'Near College Gate',
      pincode: '563120',
      isDefault: false,
    };

    return [primary, college];
  };

  const [savedAddresses, setSavedAddresses] = useState<any[]>(getInitialAddresses);

  const saveAddressesToStorage = (list: any[]) => {
    setSavedAddresses(list);
    try {
      localStorage.setItem('minnit_saved_addresses_v1', JSON.stringify(list));
    } catch {}
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = savedAddresses.map((a: any) => ({
      ...a,
      isDefault: a.id === id,
    }));
    saveAddressesToStorage(updated);
    playSound('tap');
  };

  const handleDeleteAddress = (id: string) => {
    if (savedAddresses.length <= 1) {
      alert('You must have at least one saved delivery address.');
      return;
    }
    const updated = savedAddresses.filter((a: any) => a.id !== id);
    if (!updated.some((a: any) => a.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    saveAddressesToStorage(updated);
    playSound('tap');
  };

  const handleSaveNewAddress = () => {
    if (!newAddressForm.line1.trim() || !newAddressForm.pincode.trim()) {
      alert('Please enter street address and pincode.');
      return;
    }
    const newAddr = {
      id: `addr-${Date.now()}`,
      title: newAddressForm.title.trim() || 'Other',
      line1: newAddressForm.line1.trim(),
      line2: newAddressForm.line2.trim() || 'KGF',
      landmark: newAddressForm.landmark.trim(),
      pincode: newAddressForm.pincode.trim(),
      isDefault: false,
    };
    saveAddressesToStorage([...savedAddresses, newAddr]);
    setIsAddingNewAddress(false);
    setNewAddressForm({
      title: 'Home',
      line1: '',
      line2: '',
      landmark: '',
      pincode: '563122',
    });
    playSound('success');
  };

  // Live Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [storesMap, setStoresMap] = useState<Record<string, string>>({
    g1: 'Mhetha Stores',
    s1: 'Mhetha Stores',
    g2: 'Vishal Mart',
    s2: 'Vishal Mart',
    g3: 'RR Bazar',
    s3: 'RR Bazar',
    d1: 'Nandhini KGF',
    s4: 'Nandhini KGF',
    f1: 'Bakio',
    f2: 'Mayura',
    f3: 'Ambur Biriyani KGF',
    f4: 'Al Baik',
    f5: 'Al Naz'
  });

  const fetchOrdersAndStores = async () => {
    try {
      const phone = userProfile?.phone || formData.phone || '8217649688';
      
      const [storesRes, ordersRes] = await Promise.all([
        supabase.from('stores').select('id, name'),
        supabase
          .from('orders')
          .select('*')
          .or(`customer_id.eq.${phone},recipient_phone.eq.${phone}`)
          .order('created_at', { ascending: false })
      ]);

      if (storesRes.data) {
        const map: Record<string, string> = {};
        storesRes.data.forEach((st: any) => {
          map[st.id] = st.name;
        });
        setStoresMap(prev => ({ ...prev, ...map }));
      }

      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.warn("Failed to load customer orders:", err);
    }
  };

  useEffect(() => {
    fetchOrdersAndStores();

    const phone = userProfile?.phone || formData.phone || '8217649688';
    const channel = supabase
      .channel(`customer-orders-live-${phone}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrdersAndStores();
        }
      )
      .subscribe();

    const interval = setInterval(fetchOrdersAndStores, 3500);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userProfile?.phone, formData.phone]);

  // Automatically open "My Orders" if navigated from "Track Order" button
  useEffect(() => {
    if (location.state?.openOrders) {
      setOrdersModal(true);
    }
  }, [location.state]);

  // Timer countdown for resend
  useEffect(() => {
    let interval: any;
    if (showOtpModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, resendTimer]);

  const generateRandomOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'phone' || e.target.name === 'confirmPhone') {
      setPhoneError('');
    }
  };

  const validatePhone = (phone: string) => {
    if (phone.length !== 10) return false;
    if (!/^[6-9]/.test(phone)) return false; // Indian numbers start with 6-9
    if (/^(\d)\1{9}$/.test(phone)) return false; // Prevent 1111111111 etc.
    return true;
  };

  const handleGetVerification = () => {
    if (!validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (formData.phone !== formData.confirmPhone) {
      setPhoneError('Phone numbers do not match.');
      return;
    }
    setPhoneError('');
    const newOtp = generateRandomOtp();
    setGeneratedOtp(newOtp);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setCopied(false);
    setResendTimer(30);
    setShowSmsBanner(false);
    setIsOtpSending(true);
    setShowOtpModal(true);
    playSound('modal-pop');

    // 1.3s realistic verification & SMS dispatch delay
    setTimeout(() => {
      setIsOtpSending(false);
      setShowSmsBanner(true);
      playSound('sms-ping');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }, 3000);
  };

  const handleCopyAndAutoFill = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(generatedOtp).catch(() => {});
      }
    } catch {}
    setOtpDigits(generatedOtp.split(''));
    setCopied(true);
    setOtpError('');
    playSound('tap');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      setOtpError('');
      return;
    }

    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split('');
      const next = [...otpDigits];
      chars.forEach((c, i) => {
        if (index + i < 6) next[index + i] = c;
      });
      setOtpDigits(next);
      const nextFocus = Math.min(index + chars.length, 5);
      inputRefs.current[nextFocus]?.focus();
      setOtpError('');
      return;
    }

    const next = [...otpDigits];
    next[index] = cleanVal[cleanVal.length - 1];
    setOtpDigits(next);
    setOtpError('');
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const chars = pasteData.split('');
      const next = ['', '', '', '', '', ''];
      chars.forEach((c, i) => {
        if (i < 6) next[i] = c;
      });
      setOtpDigits(next);
      setOtpError('');
      const targetIdx = Math.min(chars.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const handleResend = () => {
    if (resendTimer > 0 || isOtpSending) return;
    const newOtp = generateRandomOtp();
    setGeneratedOtp(newOtp);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setCopied(false);
    setResendTimer(30);
    setShowSmsBanner(false);
    setIsOtpSending(true);
    playSound('tap');

    setTimeout(() => {
      setIsOtpSending(false);
      setShowSmsBanner(true);
      playSound('sms-ping');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }, 1300);
  };

  const isFormValid = 
    formData.name.trim() !== '' && 
    formData.phone.length === 10 && 
    formData.confirmPhone.length === 10 && 
    formData.addressLine1.trim() !== '' && 
    formData.addressLine2.trim() !== '' &&
    formData.pincode.length === 6;

  const enteredOtp = otpDigits.join('');
  const isOtpValid = enteredOtp.length === 6;

  const handleOtpConfirm = async () => {
    if (enteredOtp !== generatedOtp) {
      setOtpError('Invalid code. Please check your 6-digit OTP.');
      playSound('error');
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Upsert into Supabase profiles table (new schema)
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: formData.phone,
          name: formData.name,
          phone: formData.phone,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2,
          landmark: formData.landmark,
          pincode: formData.pincode,
          delivery_verified: false
        });

      if (error) throw error;

      // 2. Persist user to global store
      register(formData);
      setShowOtpModal(false);
      setStep('success');
    } catch (err: any) {
      console.error("Failed to register user to Supabase:", err);
      const errorMessage = err?.message || err?.error_description || JSON.stringify(err);
      alert(`Registration failed: ${errorMessage}\n\nMake sure your .env keys are correct and server is restarted!`);
    } finally {
      setIsVerifying(false);
    }
  };

  const renderForm = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
          <User className="w-8 h-8 text-brand" />
        </div>
        <h2 className="font-black text-2xl text-text-primary mb-1 tracking-tight">Profile Registration</h2>
        <p className="text-text-secondary text-sm">Create your Minnit account</p>
      </div>

      <div className="space-y-4 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        
        {/* Name */}
        <div>
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Customer Name <span className="text-red-500">*</span></label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-sm" />
        </div>

        {/* Phones */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Phone Number <span className="text-red-500">*</span></label>
            <div className="flex rounded-xl border border-gray-200 focus-within:border-brand focus-within:bg-white focus-within:ring-4 focus-within:ring-brand/10 overflow-hidden transition-all bg-gray-50/50">
              <span className="px-4 py-3.5 bg-gray-100/50 border-r border-gray-200 font-bold text-text-primary text-sm flex items-center">
                🇮🇳 +91
              </span>
              <input type="tel" name="phone" maxLength={10} value={formData.phone} onChange={(e) => { setFormData({...formData, phone: e.target.value.replace(/\D/g, '')}); setPhoneError(''); }} placeholder="10-digit mobile" className="flex-1 px-4 py-3.5 outline-none font-bold tracking-wider text-sm bg-transparent" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Confirm Phone <span className="text-red-500">*</span></label>
            <input type="tel" name="confirmPhone" maxLength={10} value={formData.confirmPhone} onChange={(e) => { setFormData({...formData, confirmPhone: e.target.value.replace(/\D/g, '')}); setPhoneError(''); }} placeholder="Re-enter mobile number" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-bold tracking-wider text-sm" />
          </div>
        </div>

        {phoneError && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs text-red-500 font-bold px-1">
            {phoneError}
          </motion.p>
        )}

        <div className="h-px w-full bg-gray-100 my-2" />

        {/* Address */}
        <div>
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Address Details <span className="text-red-500">*</span></label>
          <div className="space-y-2">
            <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} placeholder="House / Flat / Street Name" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-sm" />
            <div>
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1 block">Area / Locality <span className="text-red-500">*</span></label>
              <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} placeholder="Area (e.g. Bowrilalpet, Robertsonpet)" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">Landmark</label>
            <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="Near temple" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 block">PIN Code <span className="text-red-500">*</span></label>
            <input type="tel" name="pincode" maxLength={6} value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} placeholder="563122" className="w-full px-4 py-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 outline-none transition-all font-bold tracking-widest text-sm text-center" />
          </div>
        </div>

      </div>

      <div className="flex items-center gap-2 mt-2 py-3 px-4 bg-emerald-50/70 text-emerald-700 rounded-xl border border-emerald-100">
        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-semibold">Location access enabled</span>
      </div>

      <p className="text-center text-xs text-text-secondary px-4 mt-6">
        Submit your details to register and verify your profile for instant future orders.
      </p>

      <Button 
        disabled={!isFormValid}
        onClick={handleGetVerification}
        className="w-full h-14 mt-2 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-brand border-0 shadow-[0_8px_20px_rgba(5,150,105,0.30)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.45)] hover:scale-[1.02] transition-all uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
      >
        <ShoppingBag className="w-4 h-4" />
        Verify &amp; Create Account
      </Button>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      onAnimationComplete={() => playSound('success')}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      {/* Animated checkmark ring */}
      <div className="relative w-28 h-28 mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.15, 1] }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
          className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-brand rounded-full flex items-center justify-center shadow-[0_16px_40px_rgba(5,150,105,0.35)]"
        >
          <CheckCircle2 className="w-14 h-14 text-white" />
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
          className="absolute inset-0 bg-brand/30 rounded-full"
        />
      </div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full">
        <h2 className="font-black text-3xl text-text-primary tracking-tight mb-1">Welcome aboard!</h2>
        <p className="text-text-secondary text-sm mb-8 font-medium">Your Minnit account is all set 🎉</p>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_32px_rgba(5,150,105,0.08)] border border-emerald-100 w-full mb-6 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl -mr-6 -mt-6" />
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3">Account Details</p>
          <p className="font-black text-2xl text-text-primary mb-0.5">{formData.name}</p>
          <p className="font-mono text-sm font-bold text-gray-500 tracking-wider mb-4">+91 {formData.phone}</p>
          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(5,150,105,0.3)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </div>
        </div>

        <button 
          onClick={() => { setStep('dashboard'); navigate('/'); }}
          className="w-full h-14 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-brand shadow-[0_8px_20px_rgba(5,150,105,0.35)] hover:shadow-[0_10px_28px_rgba(5,150,105,0.45)] hover:scale-[1.02] transition-all rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <ShoppingBag className="w-5 h-5" />
          Continue Shopping
        </button>
      </motion.div>
    </motion.div>
  );

  // ─── Policy content ───────────────────────────────────────────────────────
  const policyContent = {
    privacy: {
      title: 'Privacy Policy',
      badge: '🔒 100% Data Protection',
      sections: [
        {
          heading: '1. Information We Collect',
          content: 'We collect your name, 10-digit mobile number, and delivery address solely to facilitate instant local order delivery and authentication in KGF.',
        },
        {
          heading: '2. Live Location & Order Tracking',
          content: 'Your delivery location and optional GPS coordinates are accessed only while an order is active to calculate delivery routes and guide your delivery rider.',
        },
        {
          heading: '3. Zero Third-Party Sharing',
          content: 'Minnit never sells, rents, or shares your personal data with third-party advertisers or marketing agencies. Data is strictly used for hyperlocal order fulfillment.',
        },
        {
          heading: '4. Delivery PIN Security',
          content: 'Delivery handshake PINs ensure that only you can authorize and complete the collection of your order at your doorstep.',
        },
        {
          heading: '5. Account & Data Rights',
          content: 'You can update your address anytime or contact support@minnitkgf.in to request full account data deletion.',
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      badge: '⚖️ Platform Guidelines',
      sections: [
        {
          heading: '1. Platform Scope',
          content: 'Minnit KGF provides an online hyperlocal marketplace connecting customers in KGF with verified local merchant stores and independent fleet delivery riders.',
        },
        {
          heading: '2. Order Confirmation & Fulfillment',
          content: 'Placing an order sends an immediate request to the selected store counter. Orders are subject to item stock availability at store partner premises.',
        },
        {
          heading: '3. Doorstep Delivery & Handshake',
          content: 'Customers agree to be available at the specified delivery address and share the 4-digit PIN with the delivery rider to complete handover.',
        },
        {
          heading: '4. Fair Pricing & Delivery Charges',
          content: 'All item prices reflect local store counter prices with transparent hyperlocal delivery fee calculation and zero hidden surge markups.',
        },
        {
          heading: '5. Genuine Usage Policy',
          content: 'Minnit reserves the right to suspend or restrict accounts engaging in fraudulent orders, abusive behavior, or policy violations.',
        },
      ],
    },
    refund: {
      title: 'Refund & Cancellation Policy',
      badge: '💸 100% Fair Guarantee',
      sections: [
        {
          heading: '1. Order Cancellation',
          content: 'Free cancellation with full instant refund is available before the merchant begins packing or preparing your items. Once out for delivery, cancellation is not permissible.',
        },
        {
          heading: '2. Wrong or Missing Items',
          content: 'If an item is missing or an incorrect product was delivered, report via WhatsApp within 24 hours for an instant item refund or replacement.',
        },
        {
          heading: '3. Damaged or Expired Goods',
          content: 'If any groceries, food, or dairy products arrive damaged or past their expiry, we provide a 100% full refund upon photo verification.',
        },
        {
          heading: '4. Non-Delivery Protection',
          content: 'If an order fails to reach your doorstep due to rider or store issues, a 100% immediate full refund is credited to your payment source.',
        },
        {
          heading: '5. Refund Processing Timelines',
          content: 'UPI / Online refunds are processed within 2–24 hours to your original bank account. For instant assistance, reach out directly to support on WhatsApp (+91 82176 49688).',
        },
      ],
    },
  };

  const renderDashboard = () => {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=059669&color=fff&size=200&font-size=0.4&bold=true`;

    // ── Trust tier — read from persisted profile ─────────────────────────
    const deliveryVerified = userProfile?.deliveryVerified ?? false;
    const orderCount       = orders.length || (userProfile?.completedOrdersCount ?? 0);
    const isTrusted        = deliveryVerified || orderCount >= 1;

    // Active vs Past Orders
    const activeOrders = orders.filter(o => 
      ['PLACED', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'OUT_OF_SHOP', 'HANDED_OVER', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
    );
    const pastOrders = orders.filter(o => 
      ['DELIVERED', 'REJECTED', 'CANCELLED'].includes(o.status)
    );
    const topActiveOrder = activeOrders[0] || (orders.length > 0 && orders[0].status !== 'DELIVERED' && orders[0].status !== 'REJECTED' ? orders[0] : null);

    // Status Helper
    const getOrderStatusInfo = (status: string, prepTime?: number, rejectionReason?: string) => {
      switch (status) {
        case 'PLACED':
        case 'PENDING':
          return {
            stepIndex: 0,
            title: 'Order Sent to Counter 📥',
            subtitle: 'Waiting for store to confirm and begin packing...',
            badgeText: 'Order Placed',
            badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            dotClass: 'bg-emerald-500 animate-ping',
            step1Label: 'Placed',
            step2Label: 'Packing',
            step3Label: 'Handover',
            progress: 25,
            icon: Package,
            iconColor: 'text-emerald-600',
            isHandedOver: false
          };
        case 'ACCEPTED':
        case 'PREPARING':
          return {
            stepIndex: 1,
            title: 'Store is Preparing & Packing 🍳',
            subtitle: `Store is assembling fresh items (ETA: ~${prepTime || 10}m)`,
            badgeText: 'Store Preparing',
            badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
            dotClass: 'bg-amber-500 animate-pulse',
            step1Label: 'Placed ✓',
            step2Label: 'Packing Now ⏳',
            step3Label: 'Handover',
            progress: 50,
            icon: ChefHat,
            iconColor: 'text-amber-600',
            isHandedOver: false
          };
        case 'READY':
        case 'READY_FOR_PICKUP':
          return {
            stepIndex: 2,
            title: 'Items Packed & Ready for Pickup 📦',
            subtitle: 'Store finished packing. Rider is arriving at the counter.',
            badgeText: 'Packed & Ready',
            badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
            dotClass: 'bg-blue-600 animate-pulse',
            step1Label: 'Placed ✓',
            step2Label: 'Packed ✓',
            step3Label: 'Pickup ⏳',
            progress: 75,
            icon: Package,
            iconColor: 'text-blue-600',
            isHandedOver: false
          };
        case 'OUT_OF_SHOP':
        case 'HANDED_OVER':
          return {
            stepIndex: 2,
            title: 'Store Handed Package to Rider 🤝',
            subtitle: 'Merchant handed over order. Rider is confirming custody on device.',
            badgeText: 'Handed Over (Confirming)',
            badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
            dotClass: 'bg-amber-600 animate-bounce',
            step1Label: 'Placed ✓',
            step2Label: 'Packed ✓',
            step3Label: 'Confirming 🤝',
            progress: 85,
            icon: Bike,
            iconColor: 'text-amber-600',
            isHandedOver: true
          };
        case 'PICKED_UP':
        case 'OUT_FOR_DELIVERY':
          return {
            stepIndex: 2,
            title: 'Rider is Rushing to Your Door! 🛵',
            subtitle: 'Rider confirmed package custody and is en-route to your location.',
            badgeText: 'Out for Delivery',
            badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
            dotClass: 'bg-blue-600 animate-bounce',
            step1Label: 'Placed ✓',
            step2Label: 'Packed ✓',
            step3Label: 'On the Way 🛵',
            progress: 95,
            icon: Bike,
            iconColor: 'text-blue-600',
            isHandedOver: true
          };
        case 'DELIVERED':
          return {
            stepIndex: 3,
            title: 'Delivered to Doorstep 🎉',
            subtitle: 'Order fulfilled successfully. Enjoy your fresh order!',
            badgeText: 'Delivered & Closed',
            badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
            dotClass: 'bg-emerald-600',
            step1Label: 'Placed ✓',
            step2Label: 'Packed ✓',
            step3Label: 'Delivered ✓',
            progress: 100,
            icon: CheckCircle2,
            iconColor: 'text-emerald-600',
            isHandedOver: true
          };
        case 'REJECTED':
        case 'CANCELLED':
          return {
            stepIndex: -1,
            title: 'Order Cancelled by Store ❌',
            subtitle: rejectionReason ? `Reason: ${rejectionReason}` : 'Store was unable to fulfill this order.',
            badgeText: 'Cancelled',
            badgeClass: 'bg-red-100 text-red-900 border-red-300',
            dotClass: 'bg-red-500',
            step1Label: 'Placed',
            step2Label: 'Cancelled',
            step3Label: 'Refunded',
            progress: 0,
            icon: AlertCircle,
            iconColor: 'text-red-600',
            isHandedOver: false
          };
        default:
          return {
            stepIndex: 0,
            title: 'Order Processing',
            subtitle: 'Connecting with store...',
            badgeText: status,
            badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
            dotClass: 'bg-gray-400',
            step1Label: 'Placed',
            step2Label: 'Packing',
            step3Label: 'Delivery',
            progress: 30,
            icon: Package,
            iconColor: 'text-gray-600',
            isHandedOver: false
          };
      }
    };

    const hasActiveOrder = activeOrders.length > 0;

    const tiles = [
      {
        id: 'orders',
        icon: Package,
        label: 'My Orders',
        sublabel: hasActiveOrder ? 'Live tracking in progress ⚡' : 'View past orders & history',
        bg: hasActiveOrder ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50 text-brand',
        iconColor: hasActiveOrder ? 'text-emerald-700' : 'text-brand',
        action: () => { playSound('tap'); setOrdersModal(true); },
        isLive: hasActiveOrder,
      },
      {
        id: 'addresses',
        icon: MapPin,
        label: 'Saved Addresses',
        sublabel: `${savedAddresses.length} ${savedAddresses.length === 1 ? 'spot' : 'spots'} saved`,
        bg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        action: () => { playSound('tap'); setAddressesModal(true); },
        isLive: false,
      },
      {
        id: 'support',
        icon: MessageCircle,
        label: 'Help & Support',
        sublabel: 'Chat on WhatsApp',
        bg: 'bg-green-50',
        iconColor: 'text-green-600',
        action: () => window.open('https://wa.me/918217649688?text=Hi%20Minnit,%20I%20need%20help%20with%20my%20account', '_blank'),
        isLive: false,
      },
      {
        id: 'about',
        icon: Info,
        label: 'About Minnit',
        sublabel: 'App info & version',
        bg: 'bg-gray-50',
        iconColor: 'text-gray-500',
        action: () => setAboutModal(true),
        isLive: false,
      },
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">

        {/* ── Hero header card ── */}
        <div className="relative overflow-hidden rounded-3xl mb-5 bg-gradient-to-br from-emerald-600 via-brand to-emerald-800 p-5 shadow-[0_12px_40px_rgba(5,150,105,0.35)]">
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 bg-white/5 rounded-full" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg shrink-0" style={{ width: 64, height: 64 }}>
              <img src={avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">Welcome back</p>
              <h2 className="font-black text-xl text-white truncate leading-tight">{formData.name || 'User'}</h2>
              <p className="text-white/60 text-xs font-mono tracking-wider">+91 {formData.phone}</p>
            </div>
            {/* Dynamic trust badge */}
            {isTrusted ? (
              <div className="shrink-0 bg-amber-400/20 backdrop-blur-md text-amber-200 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-300/40 flex items-center gap-1">
                <span>⭐</span>
                Verified Customer
              </div>
            ) : (
              <div className="shrink-0 bg-white/20 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-medium border border-white/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Phone Verified
              </div>
            )}
          </div>
        </div>

        {/* ── 2×2 Action tiles ── */}
        <div className="grid grid-cols-2 gap-3.5 mb-5">
          {tiles.map(({ id, icon: Icon, label, sublabel, bg, iconColor, action, isLive }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.96 }}
              onClick={action}
              className={`relative rounded-3xl p-4.5 text-left transition-all overflow-hidden flex flex-col items-start gap-3 ${
                isLive
                  ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/90 border-2 border-emerald-400/90 shadow-[0_0_26px_rgba(16,185,129,0.38)] ring-2 ring-emerald-300/60 ring-offset-1'
                  : 'bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50'
              }`}
            >
              {/* Magical Shimmer & Sparkle Effect for Active Tracking */}
              {isLive && (
                <>
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '250%' }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12 pointer-events-none z-10"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse z-20">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>LIVE</span>
                  </div>
                </>
              )}

              <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center relative shrink-0`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
                {isLive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div>
                <p className="font-black text-sm text-text-primary leading-tight flex items-center gap-1.5">
                  {label}
                </p>
                {isLive ? (
                  <p className="text-[11px] font-black text-emerald-700 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Tracking live order ⚡
                  </p>
                ) : (
                  <p className="text-[10px] text-text-secondary font-medium mt-0.5 leading-tight">{sublabel}</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Stats bar: only visible when orderCount > 0 ── */}
        {orderCount > 0 && (
          <div className="bg-white rounded-2xl px-5 py-3 mb-5 shadow-sm border border-gray-100 flex items-center justify-center gap-2">
            <Package className="w-4 h-4 text-brand" />
            <span className="font-bold text-sm text-text-primary">📦 {orderCount} Total Orders Placed</span>
          </div>
        )}

        {/* ── Legal footer ── */}
        <div className="flex justify-center gap-5 mb-5">
          {(['privacy', 'terms', 'refund'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setPolicyModal(key)}
              className="text-xs text-gray-400 hover:text-brand transition-colors font-medium"
            >
              {key === 'privacy' ? 'Privacy Policy' : key === 'terms' ? 'Terms of Service' : 'Refund Policy'}
            </button>
          ))}
        </div>

        {/* ── Sign Out ── */}
        <button
          onClick={() => { logout(); setStep('form'); }}
          className="flex items-center justify-center gap-2 w-full py-3.5 text-red-500 font-black rounded-2xl text-sm tracking-wider border border-red-100 bg-red-50/50 active:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        {/* ── MY ORDERS & LIVE TRACKING MODAL ── */}
        <AnimatePresence>
          {ordersModal && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setOrdersModal(false)} 
              />
              
              <motion.div
                initial={{ opacity: 0, y: '100%' }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="relative bg-slate-50 rounded-t-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="bg-white px-5 pt-5 pb-3.5 border-b border-gray-100 sticky top-0 z-10 shadow-xs">
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                        <Package className="w-5 h-5 text-brand" />
                        My Orders
                      </h2>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {hasActiveOrder ? 'Live store & rider tracking active' : 'View your completed orders and receipts'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setOrdersModal(false)}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Orders Content */}
                <div className="p-4 overflow-y-auto space-y-4 flex-1 pb-16">
                  {/* 1. LIVE ACTIVE ORDERS SECTION */}
                  {activeOrders.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand"></span>
                        </span>
                        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                          Live Active Orders ({activeOrders.length})
                        </h3>
                      </div>

                      {activeOrders.map((order) => {
                        const statusInfo = getOrderStatusInfo(order.status, order.prep_time_minutes, order.rejection_reason);
                        const storeName = storesMap[order.store_id] || (order.store_id === 'g1' || order.store_id === 's1' ? 'Mhetha Stores' : order.store_id === 'd1' || order.store_id === 's4' ? 'Nandhini KGF' : 'Partner Store');

                        return (
                          <div key={order.id} className="bg-white rounded-3xl p-5 border-2 border-emerald-300 shadow-[0_4px_20px_rgba(5,150,105,0.1)] space-y-4">
                            {/* Top header */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                              <div>
                                <h3 className="font-black text-base text-gray-900 flex items-center gap-1.5">
                                  <Store className="w-4 h-4 text-brand" />
                                  {storeName}
                                </h3>
                                <p className="font-mono text-xs font-bold text-gray-400">{order.id}</p>
                              </div>
                              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusInfo.badgeClass}`}>
                                {statusInfo.badgeText}
                              </span>
                            </div>

                            {/* Live Stepper Status Card */}
                            <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 rounded-2xl p-4 border border-emerald-200">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <div className={`w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 ${statusInfo.iconColor}`}>
                                  <statusInfo.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-xs text-gray-900 leading-tight">{statusInfo.title}</h4>
                                  <p className="text-[11px] text-gray-600 font-medium leading-tight mt-0.5">{statusInfo.subtitle}</p>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-gray-200/80 h-2 rounded-full overflow-hidden mt-3">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${statusInfo.progress}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-emerald-500 to-brand rounded-full"
                                />
                              </div>

                              {/* 3 Step Timeline */}
                              <div className="mt-4 space-y-2.5 border-t border-emerald-100/60 pt-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                                    ✓
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-xs text-gray-900">Order Received at Store Counter</p>
                                    <p className="text-[10px] text-gray-400 font-mono">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                    statusInfo.stepIndex >= 1 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {statusInfo.stepIndex >= 1 ? (statusInfo.stepIndex > 1 ? '✓' : '2') : '2'}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-bold text-xs ${statusInfo.stepIndex >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                                      Store Preparing &amp; Packing Items
                                    </p>
                                    <p className="text-[10px] text-gray-400">Fresh packing at counter</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                    statusInfo.stepIndex >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {statusInfo.stepIndex >= 2 ? '✓' : '3'}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-bold text-xs ${statusInfo.stepIndex >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                                      Store Handover to Rider Complete 🛵
                                    </p>
                                    <p className="text-[10px] text-gray-400">Rider rolling to your address</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Items Summary */}
                            <div className="border-t border-gray-100 pt-3">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Items in Package</p>
                              <div className="space-y-1.5">
                                {order.items?.map((it: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-xs text-gray-700">
                                    <span>{it.quantity}x {it.name}</span>
                                    <span className="font-mono font-bold text-gray-900">{formatCurrency((it.price_paise || 0) * it.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Total and Actions */}
                            <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block">Paid via UPI</span>
                                <span className="font-mono font-black text-base text-brand">{formatCurrency(order.estimated_total)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRequestBill(order.id)}
                                  className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-2xs"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>View Bill</span>
                                </button>
                                <button
                                  onClick={() => window.open(`https://wa.me/918217649688?text=Hi%20Minnit,%20need%20help%20with%20order%20${order.id}`, '_blank')}
                                  className="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                  Need Help?
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. PREVIOUS ORDERS HISTORY SECTION */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 px-1 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-gray-400" />
                      Previous Orders ({pastOrders.length})
                    </h3>

                    {pastOrders.length === 0 && activeOrders.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 bg-white rounded-3xl p-6 border border-gray-100">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <h4 className="font-bold text-gray-800 text-sm">No Orders Yet</h4>
                        <p className="text-xs text-gray-400 mt-1 mb-4">Delicious meals and fresh groceries are waiting in KGF.</p>
                        <button
                          onClick={() => { setOrdersModal(false); navigate('/'); }}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-brand text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-sm"
                        >
                          Start Shopping
                        </button>
                      </div>
                    ) : pastOrders.length === 0 ? (
                      <div className="text-center py-4 text-xs text-gray-400 bg-white rounded-2xl border border-gray-100 p-3">
                        No previous completed orders yet.
                      </div>
                    ) : (
                      pastOrders.map((order) => {
                        const isDelivered = order.status === 'DELIVERED';
                        const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
                        const storeName = storesMap[order.store_id] || (order.store_id === 'g1' || order.store_id === 's1' ? 'Mhetha Stores' : order.store_id === 'd1' || order.store_id === 's4' ? 'Nandhini KGF' : 'Partner Store');

                        return (
                          <div key={order.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                                  <Store className="w-3.5 h-3.5 text-brand" />
                                  {storeName}
                                </h4>
                                <p className="text-[10px] font-mono text-gray-400">
                                  {order.id} • {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                isDelivered 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : isCancelled
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {isDelivered ? 'Delivered ✓' : isCancelled ? 'Cancelled' : order.status}
                              </span>
                            </div>

                            <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl font-medium">
                              {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(', ') || 'Groceries & Essentials'}
                            </div>

                            <div className="flex justify-between items-center pt-1 border-t border-gray-100/80">
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block">Total Paid</span>
                                <span className="font-mono font-black text-sm text-gray-900">{formatCurrency(order.estimated_total)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRequestBill(order.id)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs"
                                  title="View detailed tax bill & receipt"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Request Bill</span>
                                </button>
                                <button
                                  onClick={() => { setOrdersModal(false); navigate('/'); }}
                                  className="text-[11px] font-black text-brand uppercase tracking-wider hover:underline px-1 py-1"
                                >
                                  Reorder →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Saved Addresses Modal (bottom-sheet) ── */}
        <AnimatePresence>
          {addressesModal && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => { setAddressesModal(false); setIsAddingNewAddress(false); }}
              />
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="relative bg-slate-50 rounded-t-[2.5rem] shadow-2xl px-5 pt-4 pb-12 w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden"
              >
                {/* Grab Handle */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-gray-900 leading-tight">Saved Addresses</h3>
                      <p className="text-xs text-gray-500 font-medium">Manage your KGF delivery locations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setAddressesModal(false); setIsAddingNewAddress(false); }}
                    className="w-8 h-8 bg-gray-200/70 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Content (Scrollable with generous bottom clearance) */}
                <div className="overflow-y-auto py-4 space-y-3.5 flex-1 pr-0.5 pb-28">
                  {/* List of Saved Addresses */}
                  {savedAddresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        addr.isDefault
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-gray-900">{addr.title}</span>
                          {addr.isDefault && (
                            <span className="bg-emerald-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Default
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Set Default
                            </button>
                          )}
                          {savedAddresses.length > 1 && (
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-lg transition-colors"
                              title="Delete address"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-700 font-medium leading-snug">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}
                      </p>
                      {addr.landmark && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          📍 Landmark: <span className="text-gray-700 font-medium">{addr.landmark}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                        PIN: <span className="text-gray-800 font-bold">{addr.pincode}</span>
                      </p>
                    </div>
                  ))}

                  {/* Add New Address Form / Trigger */}
                  {!isAddingNewAddress ? (
                    <button
                      onClick={() => { playSound('tap'); setIsAddingNewAddress(true); }}
                      className="w-full py-3.5 bg-white border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/40 text-emerald-700 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-98 shadow-2xs cursor-pointer"
                    >
                      <span className="text-base leading-none font-black">+</span>
                      <span>Add New Delivery Address</span>
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white p-4 rounded-2xl border-2 border-emerald-400 shadow-md space-y-3 mb-6"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                          New Address Details
                        </span>
                        <button
                          onClick={() => setIsAddingNewAddress(false)}
                          className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Title selector */}
                      <div className="flex gap-2">
                        {['Home', 'Work', 'College', 'Other'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewAddressForm({ ...newAddressForm, title: t })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                              newAddressForm.title === t
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="House / Flat / Street Name *"
                        value={newAddressForm.line1}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, line1: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-medium focus:border-emerald-500 focus:bg-white outline-none"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Area / Locality (e.g. Robertsonpet)"
                          value={newAddressForm.line2}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, line2: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-medium focus:border-emerald-500 focus:bg-white outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Landmark"
                          value={newAddressForm.landmark}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, landmark: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-medium focus:border-emerald-500 focus:bg-white outline-none"
                        />
                      </div>

                      <input
                        type="tel"
                        maxLength={6}
                        placeholder="PIN Code (e.g. 563122) *"
                        value={newAddressForm.pincode}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-center tracking-widest focus:border-emerald-500 focus:bg-white outline-none"
                      />

                      <button
                        onClick={handleSaveNewAddress}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 uppercase tracking-wider cursor-pointer"
                      >
                        Save Address
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── DIGITAL BILL / TAX INVOICE MODAL (On-Demand) ── */}
        <AnimatePresence>
          {billModalOrder && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setBillModalOrder(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 z-10"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-brand px-5 py-4 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-base leading-tight">Tax Invoice &amp; Bill</h3>
                      <p className="text-[10px] text-emerald-100 font-medium">Minnit Quick Delivery • KGF</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBillModalOrder(null)}
                    className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Printable / Viewable Receipt Content */}
                <div className="overflow-y-auto p-5 space-y-4 flex-1 text-gray-800 text-xs">
                  {/* Store & Order Meta Box */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-gray-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-emerald-600" />
                        {storesMap[billModalOrder.store_id] || (billModalOrder.store_id === 'g1' || billModalOrder.store_id === 's1' ? 'Mhetha Stores' : billModalOrder.store_id === 'd1' || billModalOrder.store_id === 's4' ? 'Nandhini KGF' : 'Minnit Partner Store')}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        billModalOrder.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : billModalOrder.status === 'CANCELLED' || billModalOrder.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {billModalOrder.status === 'DELIVERED' ? 'Delivered ✓' : billModalOrder.status === 'CANCELLED' ? 'Cancelled' : billModalOrder.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 text-[11px]">
                      <div>
                        <span className="text-gray-400 font-bold block text-[9.5px] uppercase tracking-wider">Order ID</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-gray-800">
                          <span>{billModalOrder.id}</span>
                          <button
                            onClick={() => {
                              try {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(billModalOrder.id).catch(() => {});
                                }
                              } catch {}
                              setCopiedBillId(true);
                              setTimeout(() => setCopiedBillId(false), 2000);
                            }}
                            className="text-gray-400 hover:text-emerald-700 p-0.5"
                            title="Copy Order ID"
                          >
                            {copiedBillId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block text-[9.5px] uppercase tracking-wider">Date &amp; Time</span>
                        <span className="font-medium text-gray-700">{formatOrderDateTime(billModalOrder.created_at)}</span>
                      </div>
                    </div>

                    {/* Delivery Destination */}
                    <div className="pt-1.5 border-t border-gray-200/60 text-[11px]">
                      <span className="text-gray-400 font-bold block text-[9.5px] uppercase tracking-wider">Delivered To</span>
                      <p className="text-gray-700 font-medium leading-snug">
                        {billModalOrder.recipient_name || userProfile?.name || formData.name || 'Customer'} • +91 {String(billModalOrder.recipient_phone || billModalOrder.customer_id || formData.phone || '8217649688').replace(/\D/g, '').slice(-10)}
                      </p>
                      <p className="text-gray-500 text-[10.5px] mt-0.5">
                        📍 {billModalOrder.delivery_address?.line1 || billModalOrder.delivery_address?.addressLine1 || formData.addressLine1 || '#450, Maariyaman temple street'}, {billModalOrder.delivery_address?.line2 || billModalOrder.delivery_address?.addressLine2 || formData.addressLine2 || 'Bowrilalpet, KGF'} (PIN: {billModalOrder.delivery_address?.pincode || formData.pincode || '563122'})
                      </p>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div>
                    <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Items Ordered</span>
                      <span className="text-[10px] text-gray-500 font-bold">{billModalOrder.items?.length || 1} Item(s)</span>
                    </h4>
                    <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-white shadow-2xs">
                      {billModalOrder.items?.map((it: any, idx: number) => {
                        const itemPricePaise = it.price_paise !== undefined ? it.price_paise : (it.price ? (it.price > 1000 ? it.price : it.price * 100) : 0);
                        const lineTotal = itemPricePaise * (it.quantity || 1);
                        return (
                          <div key={idx} className="p-3 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-xs truncate">{it.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">
                                Qty: <span className="text-gray-700 font-bold">{it.quantity || 1}</span> × {formatCurrency(itemPricePaise)}
                              </p>
                            </div>
                            <span className="font-mono font-black text-gray-900 text-xs shrink-0">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bill Details Breakdown */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-gray-200/80 space-y-2 font-medium text-xs">
                    <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider pb-1 border-b border-gray-200">
                      Bill Details
                    </h4>
                    <div className="flex justify-between text-gray-600">
                      <span>Item Total</span>
                      <span className="font-mono font-bold text-gray-900">
                        {formatCurrency(billModalOrder.items?.reduce((acc: number, it: any) => {
                          const p = it.price_paise !== undefined ? it.price_paise : (it.price ? (it.price > 1000 ? it.price : it.price * 100) : 0);
                          return acc + (p * (it.quantity || 1));
                        }, 0) || billModalOrder.estimated_total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee (KGF Fast Drop)</span>
                      <span className="font-bold text-emerald-700">₹0 FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes &amp; Platform Fee</span>
                      <span className="font-bold text-emerald-700">₹0 FREE</span>
                    </div>
                    <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between items-center text-sm font-black">
                      <span className="text-gray-900">Total Paid</span>
                      <span className="font-mono text-base text-emerald-700">{formatCurrency(billModalOrder.estimated_total)}</span>
                    </div>
                  </div>

                  {/* Payment Verification Proof */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold leading-none">Paid Online via UPI</p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">100% Verified &amp; Settled</p>
                      </div>
                    </div>
                    <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      PAID ✓
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const msg = `*Minnit KGF - Order Receipt*\nOrder ID: ${billModalOrder.id}\nStore: ${storesMap[billModalOrder.store_id] || 'Minnit Store'}\nDate: ${formatOrderDateTime(billModalOrder.created_at)}\nTotal Paid: ${formatCurrency(billModalOrder.estimated_total)}\nStatus: ${billModalOrder.status}\n\nThank you for ordering with Minnit! ⚡`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Receipt</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    title="Print Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── About Minnit Modal ── */}
        <AnimatePresence>
          {aboutModal && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAboutModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm flex flex-col items-center text-center z-10"
              >
                <button onClick={() => setAboutModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-16 h-16 bg-white border border-emerald-200 rounded-2xl flex items-center justify-center mb-3 p-1.5 shadow-[0_8px_20px_rgba(5,150,105,0.15)] overflow-hidden">
                  <img src="/images/minnit_logo.jpg" alt="Minnit Logo" className="w-full h-full object-contain rounded-xl" />
                </div>
                <img src="/images/minnit_wordmark.jpg" alt="Minnit" className="h-7 w-auto object-contain mb-1" />
                <p className="text-text-secondary text-xs mb-1">Instant Hyperlocal Delivery · Version 1.0.0</p>
                <p className="text-emerald-700 text-xs font-bold mb-5">Built by Dhakav Designers</p>
                <div className="bg-gray-50 rounded-2xl p-4 w-full text-left text-xs text-gray-600 space-y-2 border border-gray-100">
                  <p>🏠 <strong className="text-gray-900">Region:</strong> Kolar Gold Fields (KGF), Karnataka</p>
                  <p>📦 <strong className="text-gray-900">Services:</strong> Groceries, Essentials &amp; Restaurant Food</p>
                  <p>📞 <strong className="text-gray-900">Support:</strong> +91 82176 49688</p>
                  <p>✉️ <strong className="text-gray-900">Email:</strong> support@minnitkgf.in</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Policy Modals (bottom-sheet) ── */}
        <AnimatePresence>
          {policyModal && (
            <div className="fixed inset-0 z-[70] flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPolicyModal(null)} />
              <motion.div
                initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="relative bg-white rounded-t-[2.5rem] shadow-2xl px-6 pt-5 pb-24 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden z-10"
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />
                <button onClick={() => setPolicyModal(null)}
                  className="absolute top-5 right-5 w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-1 shrink-0">
                  <h3 className="font-black text-xl text-text-primary">{policyContent[policyModal].title}</h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md w-fit mb-4 shrink-0">
                  {policyContent[policyModal].badge}
                </span>
                
                {/* Scrollable Policy Sections */}
                <div className="overflow-y-auto space-y-4 pr-1 text-left flex-1 pb-4">
                  {policyContent[policyModal].sections.map((sec, idx) => (
                    <div key={idx} className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100">
                      <h4 className="font-black text-xs text-gray-900 mb-1">{sec.heading}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">{sec.content}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 mt-2 shrink-0">
                  <button
                    onClick={() => setPolicyModal(null)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Got It, Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    );
  };

  return (
    <div className="p-4 pt-6 pb-28 min-h-screen bg-gray-50/50">
      <AnimatePresence mode="wait">
        {step === 'form' && <React.Fragment key="form">{renderForm()}</React.Fragment>}
        {step === 'success' && <React.Fragment key="success">{renderSuccess()}</React.Fragment>}
        {step === 'dashboard' && <React.Fragment key="dashboard">{renderDashboard()}</React.Fragment>}
      </AnimatePresence>

      {/* Simulated SMS Notification Banner */}
      <AnimatePresence>
        {showOtpModal && showSmsBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-[70] bg-slate-900/95 text-white backdrop-blur-xl rounded-2xl p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.35)] border border-white/10 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-brand flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-wider uppercase text-emerald-400">Minnit Security • Just Now</p>
                <p className="text-xs font-semibold text-gray-200 truncate">
                  OTP is <span className="font-mono font-black text-white tracking-widest bg-white/10 px-1.5 py-0.5 rounded">{generatedOtp}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyAndAutoFill}
              className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black text-[11px] px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0 transition-all shadow-sm"
            >
              Auto-fill
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minnit Phone Verification Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowOtpModal(false)}
            />
            
            {/* Bottom-sheet modal — Modern Minnit style */}
            <motion.div 
              initial={{ opacity: 0, y: '100%' }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="relative w-full max-w-sm bg-white rounded-t-[2.5rem] shadow-2xl px-6 pt-4 pb-9 flex flex-col z-10"
            >
              {/* Drag handle */}
              <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

              {/* Close */}
              <button 
                onClick={() => setShowOtpModal(false)}
                className="absolute top-5 right-5 w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Branded Header */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-13 h-13 bg-gradient-to-br from-emerald-500 to-brand border border-emerald-300 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(5,150,105,0.25)] p-3">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-xl text-text-primary leading-tight flex items-center gap-1.5">
                    Verify Mobile
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </h2>
                  <p className="text-text-secondary text-xs font-medium mt-0.5">
                    Sent to <span className="font-bold text-gray-800">+91 {formData.phone}</span>
                  </p>
                </div>
              </div>

              {/* SMS Dispatch & Loading State Card */}
              {isOtpSending ? (
                <div className="w-full bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3.5 mb-5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center shrink-0">
                    <RefreshCw className="w-4 h-4 text-brand animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-xs">Generating Secure OTP</p>
                      <span className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                      </span>
                    </div>
                    <p className="text-text-secondary text-[11px] mt-0.5 truncate">
                      Dispatching via SMS gateway...
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-gradient-to-r from-emerald-50/90 via-emerald-50/50 to-teal-50/60 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center gap-3 mb-5 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200/80 shadow-sm flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 text-brand" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-800 leading-tight">Verification SMS Dispatched ✓</p>
                    <p className="text-text-secondary text-[11px] mt-0.5 leading-snug">
                      Tap <strong className="text-brand">Auto-fill</strong> in the banner above or enter the 6 digits below.
                    </p>
                  </div>
                </motion.div>
              )}
              
              {/* Segmented 6-Digit PIN Boxes */}
              <div className="w-full mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Enter 6-Digit Code</label>
                  <span className="text-[10px] font-bold text-gray-400">{enteredOtp.length}/6 digits</span>
                </div>

                <motion.div 
                  animate={otpError ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className="flex items-center justify-between gap-1.5"
                  onPaste={handlePaste}
                >
                  {otpDigits.map((digit, idx) => {
                    const isFilled = Boolean(digit);
                    const isCurrent = (enteredOtp.length === idx) || (idx === 5 && enteredOtp.length === 6);
                    return (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-11 h-14 text-center text-2xl font-mono font-black rounded-2xl border-2 transition-all outline-none ${
                          otpError 
                            ? 'border-red-300 bg-red-50/50 text-red-700' 
                            : isFilled 
                            ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 shadow-sm' 
                            : isCurrent 
                            ? 'border-brand ring-4 ring-brand/15 bg-white scale-[1.04]' 
                            : 'border-gray-200 bg-gray-50/80 text-gray-800'
                        }`}
                      />
                    );
                  })}
                </motion.div>

                {/* Error feedback */}
                {otpError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 mt-2.5 px-1 text-red-500 font-bold text-xs"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </motion.div>
                )}
              </div>

              {/* Action Button */}
              <button 
                disabled={!isOtpValid || isVerifying}
                onClick={handleOtpConfirm}
                className="w-full h-14 text-sm font-black text-white bg-gradient-to-r from-emerald-500 via-brand to-emerald-700 border-0 shadow-[0_8px_20px_rgba(5,150,105,0.35)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.45)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest rounded-2xl mb-4 disabled:opacity-40 disabled:pointer-events-none"
              >
                {isVerifying ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm &amp; Activate</span>
                  </>
                )}
              </button>

              {/* Footer row */}
              <div className="flex items-center justify-between px-1">
                <button 
                  onClick={() => setShowOtpModal(false)} 
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                >
                  ← Wrong number?
                </button>

                {resendTimer > 0 ? (
                  <span className="text-xs font-semibold text-gray-400">
                    Resend code in <strong className="text-brand">{resendTimer}s</strong>
                  </span>
                ) : (
                  <button 
                    onClick={handleResend}
                    className="text-xs font-black text-brand hover:text-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend Code
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
