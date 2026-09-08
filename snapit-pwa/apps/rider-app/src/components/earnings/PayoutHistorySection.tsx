'use client';

import React, { useState } from 'react';
import { PayoutRecord, MonthOption } from '@/types/earnings';
import { ChevronDown, Check, Receipt, Calendar } from 'lucide-react';

interface PayoutHistorySectionProps {
  monthOptions: MonthOption[];
  monthlyPayouts: Record<string, PayoutRecord[]>;
}

export const PayoutHistorySection: React.FC<PayoutHistorySectionProps> = ({
  monthOptions,
  monthlyPayouts,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    monthOptions[0]?.key || '2026-09'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedOption =
    monthOptions.find((opt) => opt.key === selectedMonthKey) || monthOptions[0];

  const currentPayouts = monthlyPayouts[selectedMonthKey] || [];

  const totalPaidInMonth = currentPayouts.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div
      id="payout-history"
      className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200/80 flex flex-col gap-3.5 relative"
    >
      {/* 1. Header: Icon + Title + Month Selector */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs shrink-0">
            <Receipt className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm text-slate-900 leading-tight">
              Payout History
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
              Completed bank payouts
            </p>
          </div>
        </div>

        {/* Clean Month Selector (Dropdown / Filter) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border border-slate-200/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{selectedOption.label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${
                isDropdownOpen ? 'rotate-180 text-slate-900' : ''
              }`}
            />
          </button>

          {/* Selection Menu Dropdown */}
          {isDropdownOpen && (
            <>
              {/* Invisible Click-away dismissal backdrop */}
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 animate-scale-up overflow-hidden">
                {monthOptions.map((opt) => {
                  const isSelected = opt.key === selectedMonthKey;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedMonthKey(opt.key);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Monthly Summary Stat Banner */}
      <div className="bg-slate-50/90 rounded-2xl px-3.5 py-2.5 border border-slate-200/70 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Total Paid in {selectedOption.label.split(' ')[0]}
        </span>
        <span className="font-mono font-black text-sm text-slate-900">
          ₹{totalPaidInMonth.toLocaleString()}
        </span>
      </div>

      {/* 3. Tactile Payout Cards */}
      <div className="flex flex-col gap-2.5">
        {currentPayouts.length > 0 ? (
          currentPayouts.map((item) => {
            const day = item.date.split(' ')[0];
            const month = item.date.split(' ')[1] || 'SEP';

            return (
              <div
                key={item.id}
                className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-3 border border-slate-200/70 flex items-center justify-between gap-3 transition-all hover:border-emerald-200 shadow-2xs"
              >
                {/* Left: Mini Calendar Tile + Payout Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-xs font-black font-mono text-slate-900 leading-none">
                      {day}
                    </span>
                    <span className="text-[8px] font-black uppercase text-emerald-700 tracking-wider leading-none mt-0.5">
                      {month}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">
                      Payout • {item.date}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Direct Transfer</span>
                    </div>
                  </div>
                </div>

                {/* Right: Payout Amount & Verified Paid Pill */}
                <div className="text-right shrink-0">
                  <span className="text-base font-black font-mono text-slate-900 block leading-tight">
                    ₹{item.amount.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200 mt-1 shadow-2xs">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Paid</span>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No payouts found for this month
          </div>
        )}
      </div>
    </div>
  );
};
