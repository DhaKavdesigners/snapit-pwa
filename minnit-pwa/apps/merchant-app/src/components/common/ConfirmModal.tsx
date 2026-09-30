import React from 'react';
import { AlertCircle, LogOut, Power, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: 'power' | 'logout' | 'alert';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  subtitle,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon = 'alert',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 relative my-auto animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title Header */}
        <div className="flex items-center gap-3 mb-3 pr-8">
          <div
            className={`p-3 rounded-2xl flex-shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-100 text-rose-600'
                : variant === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {icon === 'power' && <Power className="w-6 h-6 stroke-[2.5]" />}
            {icon === 'logout' && <LogOut className="w-6 h-6 stroke-[2.5]" />}
            {icon === 'alert' && <AlertCircle className="w-6 h-6 stroke-[2.5]" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950 truncate leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Description Body */}
        <div className="py-2">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-4 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 h-11 rounded-xl font-black text-xs text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
