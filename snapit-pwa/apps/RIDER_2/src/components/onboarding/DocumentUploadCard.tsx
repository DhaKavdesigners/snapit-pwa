'use client';

import React, { useState } from 'react';
import { CheckCircle2, Upload, FileText, Loader2 } from 'lucide-react';
import { uploadFileToSupabaseStorage } from '@/services/supabaseOrderService';

interface DocumentUploadCardProps {
  icon?: string;
  title: string;
  subtitle?: string;
  documentType?: 'aadhaar' | 'pan' | 'dl';
  documentNumber?: string;
  onNumberChange?: (val: string) => void;
  onFileUploaded?: (url: string, name: string) => void;
  isUploaded?: boolean;
  fileName?: string;
  required?: boolean;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  icon = 'description',
  title,
  subtitle,
  documentType,
  documentNumber = '',
  onNumberChange,
  onFileUploaded,
  isUploaded = false,
  fileName: initialFileName = '',
}) => {
  const [uploaded, setUploaded] = useState(isUploaded);
  const [fileName, setFileName] = useState(initialFileName);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setIsUploading(true);

      const publicUrl = await uploadFileToSupabaseStorage(file, 'kyc', `${documentType || 'doc'}-${Date.now()}-${file.name}`);
      setIsUploading(false);
      setUploaded(true);

      if (onFileUploaded && publicUrl) {
        onFileUploaded(publicUrl, file.name);
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-primary/40 space-y-3">
      <div className="flex items-center gap-3.5">
        {/* Document Icon */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            uploaded ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <FileText className="w-5 h-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">{title}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {uploaded ? fileName || 'Document uploaded' : subtitle || 'Upload photo or PDF'}
          </p>
        </div>

        {/* Upload button or checkmark */}
        <label className="cursor-pointer shrink-0">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : uploaded ? (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Uploaded</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-full text-xs font-bold transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </div>
          )}
        </label>
      </div>

      {/* Optional Document Number input */}
      {onNumberChange && (
        <div className="pt-2 border-t border-slate-100">
          <input
            type="text"
            value={documentNumber}
            onChange={(e) => onNumberChange(e.target.value)}
            placeholder={`Enter ${title} Number`}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 outline-none focus:border-primary focus:bg-white uppercase"
          />
        </div>
      )}
    </div>
  );
};
