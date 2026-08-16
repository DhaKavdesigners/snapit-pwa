/**
 * KycVaultPage.tsx — Rider document upload to private Supabase Storage
 *
 * Documents uploaded ONLY to `snapit-kyc` private bucket.
 * Zero public URLs ever generated.
 * KYC status badge tracks submission progress.
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Upload, CheckCircle, Clock, AlertTriangle, X, FileText } from 'lucide-react';

import { useRiderStore } from '../stores/riderStore';
import { supabase } from '../lib/supabase';

type DocumentType = 'aadhaar' | 'dl' | 'rc';

interface DocConfig {
  id: DocumentType;
  label: string;
  sublabel: string;
  emoji: string;
  maxSizeMB: number;
}

const DOCS: DocConfig[] = [
  {
    id: 'aadhaar',
    label: 'Aadhaar Card',
    sublabel: 'Both sides (front & back)',
    emoji: '🪪',
    maxSizeMB: 5,
  },
  {
    id: 'dl',
    label: 'Driving Licence',
    sublabel: 'Valid for 2-wheelers (LMV/MCWG)',
    emoji: '🚗',
    maxSizeMB: 5,
  },
  {
    id: 'rc',
    label: 'RC Book',
    sublabel: 'Vehicle Registration Certificate',
    emoji: '📄',
    maxSizeMB: 5,
  },
];

const KYC_STATUS_CONFIG = {
  PENDING:   { label: 'Not Submitted', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: <Clock size={13} /> },
  SUBMITTED: { label: 'Under Review',  color: 'text-amber-600 bg-amber-50 border-amber-200',  icon: <Clock size={13} /> },
  VERIFIED:  { label: 'KYC Verified',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle size={13} /> },
  REJECTED:  { label: 'Rejected',      color: 'text-red-600 bg-red-50 border-red-200', icon: <AlertTriangle size={13} /> },
};

// ── Document Upload Card ─────────────────────────────────────────────────────

interface DocCardProps {
  doc: DocConfig;
  riderId: string;
  onUploaded: () => void;
}

function DocCard({ doc, riderId, onUploaded }: DocCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > doc.maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File too large. Max ${doc.maxSizeMB}MB.`);
      setStatus('error');
      return;
    }

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Only JPG, PNG, WebP, or PDF files allowed.');
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setStatus('uploading');
    setErrorMsg('');

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    // Upload to private snapit-kyc bucket
    // Path format: rider-{uid}/{docType}/{timestamp}-{filename}
    const uploadPath = `rider-${riderId}/${doc.id}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from('snapit-kyc') // PRIVATE BUCKET — no public URL
      .upload(uploadPath, file, { upsert: true });

    if (error) {
      setStatus('error');
      setErrorMsg('Upload failed. Please retry.');
      return;
    }

    setStatus('done');
    onUploaded();
  };

  const handleReset = () => {
    setStatus('idle');
    setFileName('');
    setErrorMsg('');
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl border border-emerald-100 flex-shrink-0">
          {doc.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm">{doc.label}</p>
          <p className="text-slate-500 text-xs font-medium">{doc.sublabel}</p>
        </div>
        {status === 'done' && (
          <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
        )}
      </div>

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 rounded-xl overflow-hidden border border-slate-100"
          >
            <img src={preview} alt="Document preview" className="w-full h-32 object-cover" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status / actions */}
      {status === 'idle' && (
        <button
          id={`upload-${doc.id}-btn`}
          onClick={() => fileRef.current?.click()}
          className="w-full h-11 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-500 text-sm font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200"
        >
          <Upload size={15} /> Upload Document
        </button>
      )}

      {status === 'uploading' && (
        <div className="w-full h-11 bg-slate-50 rounded-xl flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Uploading…</span>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-3 h-11 flex items-center gap-2">
            <FileText size={14} className="text-emerald-600" />
            <span className="text-emerald-700 text-xs font-semibold truncate">{fileName}</span>
          </div>
          <button
            id={`reupload-${doc.id}-btn`}
            onClick={handleReset}
            className="w-9 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <p className="text-red-500 text-xs font-medium text-center">{errorMsg}</p>
          <button
            onClick={handleReset}
            className="w-full h-10 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors"
          >
            Retry Upload
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function KycVaultPage() {
  const rider = useRiderStore((s) => s.rider);
  const kycStatus = rider?.kycStatus ?? 'PENDING';
  const statusConfig = KYC_STATUS_CONFIG[kycStatus];

  const [uploadedCount, setUploadedCount] = useState(0);
  const allUploaded = uploadedCount >= DOCS.length;

  const handleDocUploaded = () => {
    setUploadedCount((c) => Math.min(c + 1, DOCS.length));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="brand-gradient px-4 pt-14 pb-8">
        <h1 className="text-white font-extrabold text-2xl">KYC Vault 🔐</h1>
        <p className="text-emerald-200 text-sm font-medium mt-1">
          Documents stored securely — no public access
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* KYC Status card */}
        <div className="card p-4 flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${statusConfig.color}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </div>
          <p className="text-slate-500 text-xs font-medium flex-1">
            {kycStatus === 'VERIFIED'
              ? 'All documents verified. You\'re cleared to ride!'
              : kycStatus === 'SUBMITTED'
              ? 'Our team will verify within 24 hours.'
              : kycStatus === 'REJECTED'
              ? 'Some documents were rejected. Please re-upload.'
              : 'Please upload all 3 documents to start earning.'
            }
          </p>
        </div>

        {/* Security notice */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-start gap-2">
          <span className="text-lg flex-shrink-0">🔒</span>
          <p className="text-slate-600 text-xs font-medium leading-relaxed">
            Your documents are uploaded to a <strong>private, encrypted Supabase Storage bucket</strong>.
            No public URLs are ever generated. Only SnapIt's verified admin team can access them.
          </p>
        </div>

        {/* Progress */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-700 font-bold text-sm">Upload Progress</p>
            <p className="text-emerald-600 font-bold text-sm">{uploadedCount}/{DOCS.length}</p>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              animate={{ width: `${(uploadedCount / DOCS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Document cards */}
        {DOCS.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            riderId={rider?.uid ?? 'rider-unknown'}
            onUploaded={handleDocUploaded}
          />
        ))}

        {/* Submit button */}
        <AnimatePresence>
          {allUploaded && kycStatus !== 'VERIFIED' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <button
                id="submit-kyc-btn"
                className="btn-primary w-full h-14 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Submit for Verification
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-slate-400 text-xs pb-4">
          Powered by <strong>Dhakav Designers</strong> · KGF
        </p>
      </div>
    </div>
  );
}
