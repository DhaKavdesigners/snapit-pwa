import React from 'react';
import { LegalLayout } from './LegalLayout';
import { ShieldCheck, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export const TermsView: React.FC = () => {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="Standard operational terms and platform conditions for customers of Minnit KGF."
      badge="⚖️ Platform Agreement"
      lastUpdated="October 11, 2026"
    >
      <div className="prose prose-slate max-w-none text-sm text-slate-700 space-y-6 leading-relaxed">
        
        {/* Intro */}
        <section className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5">
          <p className="font-medium text-emerald-950">
            Welcome to <strong>Minnit</strong>, an online hyperlocal delivery platform operated and owned by{' '}
            <strong>Dhakav Designers</strong> (&quot;Minnit&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), having its principal place of business at{' '}
            <strong>#48, Tailor Shop Line, Oorgaum, Kolar Gold Fields (KGF), Karnataka - 563120, India</strong>.
          </p>
          <p className="mt-2 text-xs text-emerald-800">
            By accessing our Progressive Web Application (PWA) at minnit.in, browsing products, or placing an order, you agree to be bound by these Terms &amp; Conditions and all applicable laws of India.
          </p>
        </section>

        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">1</span>
            Platform Scope &amp; Nature of Services
          </h2>
          <p>
            Minnit operates a localized quick-commerce digital marketplace connecting users located in <strong>Kolar Gold Fields (KGF)</strong> with verified local merchant partner stores (groceries, packaged food, fresh produce, restaurant items, and daily essentials) and independent delivery fleet executives.
          </p>
          <p>
            Minnit acts as a digital intermediary facilitating order placement, payment aggregation, and doorstep logistics. Store partners are independent sellers responsible for preparing and packing the ordered merchandise.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">2</span>
            User Eligibility &amp; Account Obligations
          </h2>
          <p>
            To place orders on Minnit, you must be at least 18 years of age or possess legal parental/guardian authorization. By providing your mobile phone number, delivery address, and name, you certify that all information submitted is true, accurate, and current.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your mobile number and device session tokens used to access Minnit. Any activity initiated through your verified phone number is presumed authorized by you.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">3</span>
            Order Confirmation &amp; Fulfillment
          </h2>
          <p>
            Placing an order constitutes an offer to purchase the selected items from the chosen merchant store. Order acceptance occurs when the merchant acknowledges the request and begins item preparation or packing.
          </p>
          <p>
            All orders are subject to live item stock availability at the merchant counter. If an item is discovered to be out of stock, Minnit customer care or the merchant partner will notify you promptly to offer a replacement or an instant refund of the unavailable item.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">4</span>
            Pricing, Delivery Charges &amp; Taxes
          </h2>
          <p>
            All item prices displayed on Minnit are listed in <strong>Indian Rupees (₹ INR)</strong> and include all applicable central and state goods taxes unless otherwise stated.
          </p>
          <p>
            Delivery charges are dynamically computed based on travel distance from the merchant store to your delivery address in KGF (standard base fee ranges between ₹25 and ₹35). There are zero hidden surge fees. The complete breakdown (Item Total, Delivery Fee, Taxes &amp; Discounts) is explicitly displayed in the bill breakdown before checkout.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">5</span>
            Payment Processing &amp; Razorpay Gateway
          </h2>
          <p>
            Minnit supports instant online payments and Pay on Delivery options:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Online Payments:</strong> Powered by RBI-authorized payment aggregator <strong>Razorpay Software Private Limited</strong>. Supported payment instruments include Unified Payments Interface (UPI via GPay, PhonePe, Paytm, BHIM), Debit &amp; Credit Cards (Visa, MasterCard, RuPay), and NetBanking.
            </li>
            <li>
              <strong>Pay on Delivery (Doorstep UPI QR):</strong> Customers may scan the official order-specific UPI QR code presented inside the Minnit Rider application upon package arrival.
            </li>
            <li>
              <strong>Security Assurance:</strong> Minnit does NOT capture, collect, or store sensitive credit/debit card numbers, CVV codes, or bank passwords on its servers. All payment transactions comply with Payment Card Industry Data Security Standards (PCI-DSS).
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">6</span>
            Doorstep Delivery &amp; Handshake PIN Verification
          </h2>
          <p>
            To prevent misdelivery and guarantee safe custody handover, Minnit assigns a secure <strong>4-digit Handshake PIN</strong> to every order upon confirmation.
          </p>
          <p>
            The customer agrees to be available at the chosen delivery address or instruct an authorized recipient to receive the order and verify the 4-digit PIN with the delivery executive to complete custody transfer.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">7</span>
            Cancellations, Returns &amp; Refunds
          </h2>
          <p>
            Order cancellations, replacements, and refunds are governed strictly by our dedicated{' '}
            <a href="/refund-policy" className="text-emerald-700 font-bold underline">
              Refund &amp; Cancellation Policy
            </a>
            . Customers may cancel an order free of charge prior to store packing. In the event of damaged, defective, or missing goods, refunds are credited back to the original payment source within 5 to 7 business days.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">8</span>
            Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms &amp; Conditions are governed by and construed in accordance with the laws of the Republic of India. Any disputes, controversies, or legal claims arising out of or relating to platform usage shall be subject to the exclusive jurisdiction of the competent courts in <strong>Kolar / Bengaluru, Karnataka, India</strong>.
          </p>
        </section>

        {/* Grievance Officer */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Grievance Officer &amp; Nodal Contact
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            In accordance with Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, the details of the Grievance Officer are:
          </p>
          <div className="space-y-1.5 text-xs text-slate-700 font-medium">
            <p><strong>Name:</strong> Vishva D</p>
            <p><strong>Entity:</strong> Dhakav Designers (Minnit)</p>
            <p><strong>Address:</strong> #48, Tailor Shop Line, Oorgaum, Kolar Gold Fields, Karnataka - 563120, India</p>
            <p><strong>Email:</strong> <a href="mailto:contact.minnit@gmail.com" className="text-emerald-700 font-bold underline">contact.minnit@gmail.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:+918217649688" className="text-emerald-700 font-bold font-mono">+91 82176 49688</a></p>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
};
