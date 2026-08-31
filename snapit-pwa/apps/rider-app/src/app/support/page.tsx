'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useRider } from '@/context/RiderContext';
import { createSupportTicket, fetchRiderTickets } from '@/services/supportService';
import { DbSupportTicket } from '@/lib/supabase';
import {
  LifeBuoy,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  CreditCard,
  MapPin,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Order issue', label: 'Order / Store Issue', icon: Package },
  { id: 'Payment issue', label: 'Payment & Wallet', icon: CreditCard },
  { id: 'GPS/map issue', label: 'GPS / Navigation Map', icon: MapPin },
  { id: 'Account/KYC issue', label: 'Profile / KYC Verification', icon: HelpCircle },
  { id: 'Other', label: 'General Assistance', icon: MessageSquare },
];

export default function SupportPage() {
  const { rider, activeOrder } = useRider();
  const [category, setCategory] = useState('Order issue');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<DbSupportTicket[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing tickets
  useEffect(() => {
    if (rider.phone) {
      fetchRiderTickets(rider.phone).then(setTickets);
    }
  }, [rider.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!message.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a description of your issue.' });
      return;
    }

    setIsSubmitting(true);
    const result = await createSupportTicket({
      riderPhone: rider.phone,
      category,
      message,
      orderId: activeOrder?.id || null,
    });
    setIsSubmitting(false);

    if (result.success && result.ticket) {
      setFeedbackMsg({ type: 'success', text: 'Support ticket submitted! Support will respond shortly.' });
      setMessage('');
      setTickets((prev) => [result.ticket!, ...prev]);
    } else {
      setFeedbackMsg({ type: 'error', text: result.error || 'Failed to submit ticket. Please try again.' });
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2 pb-8 max-w-md mx-auto w-full animate-fade-in">
        
        {/* Header Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Snapit Rider Care
              </span>
              <h2 className="text-xl font-black text-white mt-1">24/7 Rider Support</h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
            Need urgent help on an active order or have a query regarding earnings? Submit a ticket below.
          </p>
        </div>

        {/* Create Ticket Form Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Raise a Support Ticket</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Category Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Issue Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-400'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active order badge if applicable */}
            {activeOrder && (
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between">
                <span>Relating to Active Order:</span>
                <span className="font-mono font-black text-blue-700">#{activeOrder.orderNumber}</span>
              </div>
            )}

            {/* Message Area */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Explain your concern
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Describe what happened or what you need assistance with..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Feedback Alert */}
            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Ticket...' : 'SUBMIT TICKET'}</span>
            </button>
          </form>
        </div>

        {/* Ticket History */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 space-y-3">
          <h3 className="text-sm font-black text-slate-900 flex items-center justify-between">
            <span>Your Tickets ({tickets.length})</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Recent</span>
          </h3>

          {tickets.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No support tickets raised yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <div key={t.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{t.category}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{t.message}</p>
                  {t.admin_response && (
                    <div className="mt-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                      <strong className="block text-[10px] uppercase text-emerald-700">Support Response:</strong>
                      {t.admin_response}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 pt-0.5">
                    {new Date(t.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
