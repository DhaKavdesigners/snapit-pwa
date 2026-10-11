import React from 'react';
import { LegalLayout } from './LegalLayout';
import { Truck, Clock, MapPin, ShieldCheck, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ShippingPolicyView: React.FC = () => {
  return (
    <LegalLayout
      title="Shipping & Delivery Policy"
      subtitle="Hyperlocal express fulfillment, delivery timelines, charges, and coverage across KGF."
      badge="⚡ 10–30 Min Express Delivery"
      lastUpdated="October 11, 2026"
    >
      <div className="prose prose-slate max-w-none text-sm text-slate-700 space-y-6 leading-relaxed">
        
        {/* Intro */}
        <section className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5">
          <p className="font-medium text-emerald-950">
            <strong>Minnit</strong>, operated by <strong>Dhakav Designers</strong>, is Kolar Gold Fields&apos; premier hyperlocal quick-commerce service. We deliver fresh groceries, daily essentials, and local restaurant food directly from neighborhood stores straight to your doorstep in <strong>10 to 30 minutes</strong>.
          </p>
          <p className="mt-2 text-xs text-emerald-800">
            This Shipping &amp; Delivery Policy outlines our delivery speed commitments, service areas, fee structure, and security protocols for physical merchandise delivery.
          </p>
        </section>

        {/* Section 1: Serviceable Areas */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">1</span>
            Serviceable Localities &amp; Coverage (KGF)
          </h2>
          <p>
            Minnit currently serves customers located across the township and municipal areas of <strong>Kolar Gold Fields (KGF), Karnataka</strong>. Our active delivery fleet covers:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-bold text-slate-800">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Robertsonpet (563122)</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Andersonpet (563113)</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Oorgaum (563120)</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Marikuppam (563116)</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Coromandel (563119)</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Champion Reefs (563115)</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            * Orders placed for delivery destinations outside our operational perimeter will be flagged during address selection.
          </p>
        </section>

        {/* Section 2: Delivery Timelines */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">2</span>
            Delivery Timelines &amp; Operating Hours
          </h2>
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>Express Hyperlocal Delivery: 10 to 30 Minutes</span>
            </div>
            <p className="text-slate-700">
              Unlike traditional courier services that require 2–5 days, Minnit operates on a direct point-to-point dispatch model. The moment your order is accepted, local fleet riders head directly to the merchant counter, pick up the packaged goods, and ride immediately to your doorstep.
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 pt-1">
            <li><strong>Operating Hours:</strong> 7:00 AM to 11:00 PM IST, Monday through Sunday.</li>
            <li><strong>Peak / Weather Conditions:</strong> In events of extreme rainfall, festive traffic, or large restaurant preparation queues, deliveries may take 30 to 45 minutes. Real-time updates are continuously shown on the in-app tracker.</li>
          </ul>
        </section>

        {/* Section 3: Delivery Charges */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">3</span>
            Delivery Fee Structure
          </h2>
          <p>
            Delivery fees are computed transparently based on distance from the chosen store partner in KGF:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Base Fast Drop Fee:</strong> Typically ₹25 to ₹35 per order within KGF local limits.</li>
            <li><strong>Free Delivery Promotions:</strong> Periodically unlocked with coupon codes (e.g. <code>MINNIT50</code> or <code>WELCOME</code>) or during special community promotions.</li>
            <li><strong>Taxes &amp; Platform Fee:</strong> Transparently itemized in the cart bill before payment. Free of hidden surge multipliers.</li>
          </ul>
        </section>

        {/* Section 4: Handshake Security & Delivery PIN */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">4</span>
            Doorstep Verification &amp; Handshake PIN
          </h2>
          <p>
            To guarantee that goods reach only the authorized customer, Minnit incorporates a secure <strong>4-digit Handshake PIN</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>The PIN is generated exclusively inside your order receipt upon confirmation.</li>
            <li>When the rider arrives at your doorstep, simply share the 4-digit code.</li>
            <li>The rider enters the code into the Minnit Rider App, verifying successful custody transfer and closing the order.</li>
          </ul>
        </section>

        {/* Section 5: Unreachable Customer Protocol */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">5</span>
            Customer Unavailability at Doorstep
          </h2>
          <p>
            Upon reaching the delivery address:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>The rider will contact the primary registered mobile phone number.</li>
            <li>If unreachable, the rider will dial the optional alternate phone number provided at checkout.</li>
            <li>Riders wait up to 10 minutes at the doorstep. If the customer remains unreachable after multiple attempts, our support desk will attempt contact before resolving the trip.</li>
          </ul>
        </section>

        {/* Shipping Inquiries */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Delivery Support &amp; Fleet Enquiries
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            For live delivery status, address corrections, or rider assistance:
          </p>
          <div className="space-y-1.5 text-xs text-slate-700 font-medium">
            <p><strong>Entity:</strong> Dhakav Designers (Minnit)</p>
            <p><strong>Support Email:</strong> <a href="mailto:contact.minnit@gmail.com" className="text-emerald-700 font-bold underline">contact.minnit@gmail.com</a></p>
            <p><strong>Support Phone:</strong> <a href="tel:+918217649688" className="text-emerald-700 font-bold font-mono">+91 82176 49688</a></p>
            <p><strong>Operating Address:</strong> #48, Tailor Shop Line, Oorgaum, Kolar Gold Fields, Karnataka - 563120, India</p>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
};
