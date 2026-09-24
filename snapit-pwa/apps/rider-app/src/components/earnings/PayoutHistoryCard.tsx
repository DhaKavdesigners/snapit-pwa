'use client';

import React, { useState } from 'react';
import { PayoutRecord, MonthOption } from '@/types/earnings';
import { Receipt, ChevronDown, Check, ArrowDownToLine } from 'lucide-react';

interface Props {
  monthOptions: MonthOption[];
  monthlyPayouts: Record<string, PayoutRecord[]>;
}

export const PayoutHistoryCard: React.FC<Props> = ({ monthOptions, monthlyPayouts }) => {
  const [selectedKey, setSelectedKey]   = useState(monthOptions[0]?.key ?? '2026-09');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedOption = monthOptions.find((o) => o.key === selectedKey) ?? monthOptions[0];
  const payouts        = monthlyPayouts[selectedKey] ?? [];
  const totalPaid      = payouts.reduce((s, p) => s + p.amount, 0);

  return (
    <div
      id="payout-history"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 leading-none">Bank Payout History</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Completed bank transfers</p>
          </div>
        </div>

        {/* Month Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-[11px] font-bold transition-all cursor-pointer border border-slate-200/60"
          >
            <span>{selectedOption?.label.split(' ')[0]}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 overflow-hidden">
                {monthOptions.map((opt) => {
                  const isSelected = opt.key === selectedKey;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedKey(opt.key);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
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

      {/* ── Month Total Banner ── */}
      <div className="mx-4 mt-3 mb-2 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Total paid in {selectedOption?.label.split(' ')[0]}
        </span>
        <span className="font-mono font-black text-sm text-slate-900">
          ₹{totalPaid.toLocaleString()}
        </span>
      </div>

      {/* ── Payout List ── */}
      <div className="px-4 pb-4 flex flex-col gap-2 mt-1">
        {payouts.length > 0 ? (
          payouts.map((item) => {
            const [day, mon] = item.date.split(' ');
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-slate-50 hover:bg-emerald-50/40 rounded-xl p-3 border border-slate-100 hover:border-emerald-200 transition-all"
              >
                {/* Date Tile */}
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-black font-mono text-slate-900 leading-none">{day}</span>
                  <span className="text-[8px] font-black uppercase text-emerald-700 tracking-wider leading-none mt-0.5">{mon}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">Direct Bank Transfer</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {item.utrRef}</p>
                </div>

                {/* Amount + Status */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-black font-mono text-slate-900">
                    ₹{item.amount.toLocaleString()}
                  </p>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                    <ArrowDownToLine className="w-2.5 h-2.5" />
                    <span>Transferred</span>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No payouts yet for this month
          </div>
        )}
      </div>
    </div>
  );
};
