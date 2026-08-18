'use client';

import React, { useState } from 'react';
import { CheckCircle2, Upload, FileText } from 'lucide-react';

interface DocumentUploadCardProps {
  icon: string;
  title: string;
  subtitle: string;
  required?: boolean;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  icon,
  title,
  subtitle,
}) => {
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setUploaded(true);
    }
  };

  return (
    <div className="flex items-center gap-3.5 bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm transition-all hover:border-primary/40">
      {/* Document Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          uploaded ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
        }`}
      >
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-on-surface leading-tight truncate">{title}</h4>
        <p className="text-[11px] text-secondary mt-0.5 truncate">
          {uploaded ? fileName || 'Document uploaded' : subtitle}
        </p>
      </div>

      {/* Upload button or checkmark */}
      <label className="cursor-pointer shrink-0">
        <input type="file" className="hidden" onChange={handleFileChange} />
        {uploaded ? (
          <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-primary/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Uploaded</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-primary-container/20 text-primary hover:bg-primary-container/30 px-3 py-1.5 rounded-full text-xs font-bold transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </div>
        )}
      </label>
    </div>
  );
};
