import React from 'react';
import { LegalLayout } from './LegalLayout';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, ShieldCheck, Mail, Phone } from 'lucide-react';

export const RefundPolicyView: React.FC = () => {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle="Clear, fair refund timelines and cancellation procedures for Minnit customers."
      badge="💸 100% Fair Guarantee"
      lastUpdated="October 11, 2026"
    >
      <div className="prose prose-slate max-w-none text-sm text-slate-700 space-y-6 leading-relaxed">
        
        {/* Highlight Card */}
        <section className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5">
          <p className="font-medium text-emerald-950">
            At <strong>Minnit</strong> (operated by <strong>Dhakav Designers</strong>), customer satisfaction and product quality are our highest priorities. If an order cannot be fulfilled or arrives in an unsatisfactory condition, we guarantee prompt, transparent refunds.
          </p>
          <p className="mt-2 text-xs text-emerald-800">
            This policy applies to all orders placed through the Minnit platform in Kolar Gold Fields (KGF), Karnataka.
          </p>
        </section>

        {/* Section 1: Cancellation Policy */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">1</span>
            Order Cancellation Policy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Before Store Packing (Free)
              </span>
              <p className="text-xs text-slate-600">
                You may cancel your order at <strong>zero penalty</strong> before the store merchant partner begins preparing or packing your items. 100% of the amount paid will be refunded immediately.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
              <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                After Dispatch (Restricted)
              </span>
              <p className="text-xs text-slate-600">
                Once the merchant packs the order and the delivery rider departs (&quot;Out for Delivery&quot;), cancellations cannot be accepted due to the perishable nature of hot cooked meals and fresh dairy/groceries.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Return Eligibility */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">2</span>
            Eligibility for Return &amp; Replacement
          </h2>
          <p>
            Because Minnit delivers perishable food, vegetables, dairy, and consumer packaged goods, general returns after doorstep handover are restricted for food safety and hygiene reasons. However, you are entitled to a full refund or free replacement under the following conditions:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Damaged or Tampered Goods:</strong> Items received with broken seals, spillage, or structural packaging damage.</li>
            <li><strong>Missing Items:</strong> Items billed on your receipt that were omitted from the delivered parcel.</li>
            <li><strong>Incorrect Products:</strong> Items that do not match the product ordered on the app.</li>
            <li><strong>Expired or Spoiled Produce:</strong> Dairy, groceries, or food items past their best-before date or in substandard condition.</li>
          </ul>
          <p className="text-xs text-slate-500 pt-1">
            <strong>Reporting Window:</strong> Please report the issue within <strong>24 hours</strong> of delivery with a quick photo of the defective item via WhatsApp helpline (<a href="tel:+918217649688" className="text-emerald-700 font-bold">+91 82176 49688</a>) or email (<a href="mailto:contact.minnit@gmail.com" className="text-emerald-700 font-bold">contact.minnit@gmail.com</a>).
          </p>
        </section>

        {/* Section 3: Refund Timelines & Methods */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">3</span>
            Refund Processing Timelines (TAT)
          </h2>
          <p>
            Once a refund is approved by our support team, the funds are reversed strictly according to the original payment mode used during checkout:
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 text-xs mt-2">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="p-3 border border-slate-200 font-black">Payment Method</th>
                  <th className="p-3 border border-slate-200 font-black">Refund Destination</th>
                  <th className="p-3 border border-slate-200 font-black">Turnaround Time (TAT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 border border-slate-200 font-bold">UPI (Razorpay Gateway)</td>
                  <td className="p-3 border border-slate-200">Original UPI VPA / Bank</td>
                  <td className="p-3 border border-slate-200 text-emerald-800 font-bold">2 to 24 Hours</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-bold">Credit / Debit Cards</td>
                  <td className="p-3 border border-slate-200">Original Card Account</td>
                  <td className="p-3 border border-slate-200 text-emerald-800 font-bold">5 to 7 Business Days</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-bold">NetBanking</td>
                  <td className="p-3 border border-slate-200">Original Bank Account</td>
                  <td className="p-3 border border-slate-200 text-emerald-800 font-bold">5 to 7 Business Days</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200 font-bold">Pay on Delivery (Doorstep QR)</td>
                  <td className="p-3 border border-slate-200">Customer Verified UPI ID</td>
                  <td className="p-3 border border-slate-200 text-emerald-800 font-bold">24 to 48 Hours</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            * Turnaround times are subject to your bank&apos;s standard clearing cycles. You will receive an official Razorpay Refund Reference Number (RRN) to track the reversal with your bank.
          </p>
        </section>

        {/* Section 4: Non-Delivery Protection */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">4</span>
            Non-Delivery &amp; Store Outage Protection
          </h2>
          <p>
            If your order cannot be fulfilled due to unforeseen store closures, inventory stockouts, rider vehicle breakdown, or extreme weather conditions in KGF, Minnit provides <strong>100% full refund guarantee</strong>.
          </p>
          <p>
            No cancellation or convenience fees will ever be charged if the non-delivery is on account of Minnit or its merchant partners.
          </p>
        </section>

        {/* Section 5: Contact Support */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Refund Helpdesk &amp; Support Escalations
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            For refund status queries, missing items, or cancellation requests:
          </p>
          <div className="space-y-1.5 text-xs text-slate-700 font-medium">
            <p><strong>Entity:</strong> Dhakav Designers (Minnit)</p>
            <p><strong>Support Email:</strong> <a href="mailto:contact.minnit@gmail.com" className="text-emerald-700 font-bold underline">contact.minnit@gmail.com</a></p>
            <p><strong>Helpline / WhatsApp:</strong> <a href="tel:+918217649688" className="text-emerald-700 font-bold font-mono">+91 82176 49688</a></p>
            <p><strong>Physical Address:</strong> #48, Tailor Shop Line, Oorgaum, Kolar Gold Fields, Karnataka - 563120</p>
            <p className="text-[11px] text-slate-500 pt-1">
              Live response window: 7:00 AM to 11:00 PM IST (Mon – Sun).
            </p>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
};
