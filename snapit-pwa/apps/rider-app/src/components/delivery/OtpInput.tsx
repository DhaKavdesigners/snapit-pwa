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
            className={`w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-extrabold bg-white border-2 rounded-2xl text-on-surface outline-none transition-all shadow-sm ${
              digit
                ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                : 'border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
            }`}
          />
        ))}
      </div>

      {/* Quick Test Helper for immediate user verification */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-secondary">Test OTP is </span>
        <button
          type="button"
          onClick={quickFillSample}
          className="text-xs font-mono font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors"
        >
          1234 (Click to autofill)
        </button>
      </div>
    </div>
  );
};
