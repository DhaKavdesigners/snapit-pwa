/**
 * UpiQrModal.tsx — Doorstep UPI QR code bottom-sheet modal
 *
 * For orders with paymentMethod === 'UPI_DELIVERY':
 * - Generates a real UPI deep link QR via api.qrserver.com (no API key needed)
 * - High-contrast black on white for bright sunlight scanning
 * - Displays amount in ₹ (converted from paise)
 * - Animated bottom-sheet enter/exit via Framer Motion
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../lib/mockData';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Total order value in PAISE */
  amountPaise: number;
  /** Rider's UPI ID (e.g. "suresh.snapit@upi") */
  upiId: string;
  /** Order ID for payment reference */
  orderId: string;
  recipientName?: string;
}

function buildUpiDeepLink(upiId: string, amountPaise: number, orderId: string): string {
  const amountRupees = (amountPaise / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: upiId,
    pn: 'SnapIt Rider',
    am: amountRupees,
    cu: 'INR',
    tn: `SnapIt Order ${orderId}`,
  });
  return `upi://pay?${params.toString()}`;
}

function buildQrUrl(upiDeepLink: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiDeepLink)}&ecc=M&margin=2`;
}

export function UpiQrModal({
  isOpen,
  onClose,
  amountPaise,
  upiId,
  orderId,
  recipientName,
}: UpiQrModalProps) {
  const upiLink = buildUpiDeepLink(upiId, amountPaise, orderId);
  const qrUrl = buildQrUrl(upiLink);
  const displayAmount = formatCurrency(amountPaise);
  const [copied, setCopied] = React.useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: show UPI ID for manual copy
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="upi-qr-backdrop"
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* Bottom sheet */}
          <motion.div
            id="upi-qr-modal"
            key="sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pb-8 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-slate-900 font-bold text-lg leading-tight">
                    Collect Payment
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">
                    Ask customer to scan QR or pay via UPI
                  </p>
                </div>
                <button
                  id="upi-modal-close"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Amount badge */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between mb-5">
                <div>
                  <p className="text-emerald-700 text-xs font-semibold uppercase tracking-wide">
                    Amount to Collect
                  </p>
                  {recipientName && (
                    <p className="text-slate-500 text-xs mt-0.5">From: {recipientName}</p>
                  )}
                </div>
                <span className="text-emerald-800 font-extrabold text-2xl">{displayAmount}</span>
              </div>

              {/* QR Code — high contrast for sunlight */}
              <div className="flex justify-center mb-4">
                <div className="bg-white border-4 border-slate-900 rounded-2xl p-2 shadow-lg">
                  <img
                    src={qrUrl}
                    alt={`UPI QR code for ${displayAmount}`}
                    width={220}
                    height={220}
                    className="block rounded-lg"
                    style={{ imageRendering: 'pixelated' }}
                    loading="eager"
                  />
                </div>
              </div>

              {/* Order ID */}
              <p className="text-center text-slate-400 text-xs font-medium mb-4">
                Ref: {orderId}
              </p>

              {/* UPI ID copy row */}
              <button
                id="copy-upi-id-btn"
                onClick={handleCopyUpi}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-100 transition-colors"
              >
                <div className="text-left">
                  <p className="text-slate-500 text-xs font-medium">UPI ID</p>
                  <p className="text-slate-800 text-sm font-semibold">{upiId}</p>
                </div>
                {copied
                  ? <CheckCircle size={18} className="text-emerald-500" />
                  : <Copy size={18} className="text-slate-400" />
                }
              </button>

              {/* Open UPI app */}
              <a
                id="open-upi-app-link"
                href={upiLink}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-3"
              >
                <ExternalLink size={16} />
                Open in UPI App
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
