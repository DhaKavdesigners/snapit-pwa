'use client';

import React, { useState, useRef, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 4,
  onComplete,
  disabled = false,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;

    // Handle single character or last char of paste
    const cleanChar = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    if (cleanChar && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    const fullOtp = newDigits.join('');
    if (fullOtp.length === length && !newDigits.includes('')) {
      onComplete(fullOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);

    const targetIndex = Math.min(pastedData.length, length - 1);
    inputsRef.current[targetIndex]?.focus();

    const fullOtp = newDigits.join('');
    if (fullOtp.length === length && !newDigits.includes('')) {
      onComplete(fullOtp);
    }
  };

  const quickFillSample = () => {
    const sample = ['1', '2', '3', '4'];
    setDigits(sample);
    inputsRef.current[3]?.focus();
    onComplete('1234');
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 4 OTP Input Boxes */}
      <div className="flex justify-center gap-3 w-full">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="tel"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-black bg-white rounded-2xl text-slate-900 outline-none transition-all shadow-xs ${
              digit
                ? 'border-2 border-emerald-500 bg-emerald-50/40 text-emerald-700 ring-2 ring-emerald-500/20'
                : 'border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
        ))}
      </div>

      {/* Quick Test Helper for immediate user verification */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500">Test PIN is </span>
        <button
          type="button"
          onClick={quickFillSample}
          className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 px-2 py-0.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          1234 (Click to autofill)
        </button>
      </div>
    </div>
  );
};
