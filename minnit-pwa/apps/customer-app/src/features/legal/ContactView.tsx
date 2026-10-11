import React, { useState } from 'react';
import { LegalLayout } from './LegalLayout';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ContactView: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setFormSubmitted(true);
  };

  return (
    <LegalLayout
      title="Contact Us"
      subtitle="Reach out to the Minnit team for customer support, order assistance, or business inquiries."
      badge="📞 Customer Support"
      lastUpdated="October 11, 2026"
    >
      <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
        
        {/* Entity Card */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-1">
          <p className="font-bold text-emerald-950 text-base">
            Dhakav Designers (Minnit)
          </p>
          <p className="text-xs text-emerald-800">
            Registered Entity &amp; Hyperlocal Delivery Marketplace Provider in Kolar Gold Fields.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Address */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span>Registered &amp; Operating Address</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed pl-9">
              <strong className="text-slate-900">Dhakav Designers</strong><br />
              #48, Tailor Shop Line, Oorgaum,<br />
              Kolar Gold Fields (KGF), Karnataka - 563120, India
            </p>
          </div>

          {/* Card 2: Phone & WhatsApp */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <span>Phone &amp; WhatsApp Helpline</span>
            </div>
            <div className="space-y-1.5 pl-9 text-xs">
              <p>
                <strong className="text-slate-900">Customer Helpline:</strong>{' '}
                <a href="tel:+918217649688" className="text-emerald-700 font-bold font-mono underline">
                  +91 82176 49688
                </a>
              </p>
              <p>
                <strong className="text-slate-900">WhatsApp Support:</strong>{' '}
                <a 
                  href="https://wa.me/918217649688?text=Hello%20Minnit%20Support,%20I%20have%20an%20inquiry" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-bold underline"
                >
                  Chat with us on WhatsApp
                </a>
              </p>
            </div>
          </div>

          {/* Card 3: Email */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <span>Email Support</span>
            </div>
            <div className="space-y-1 pl-9 text-xs">
              <p>
                <strong className="text-slate-900">Primary Support:</strong><br />
                <a href="mailto:contact.minnit@gmail.com" className="text-emerald-700 font-bold underline">
                  contact.minnit@gmail.com
                </a>
              </p>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Expected email response within 2–4 hours.
              </p>
            </div>
          </div>

          {/* Card 4: Operating Hours */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span>Hours of Operation</span>
            </div>
            <div className="space-y-1 pl-9 text-xs text-slate-700">
              <p><strong className="text-slate-900">Monday to Sunday:</strong></p>
              <p className="font-bold text-emerald-800">7:00 AM – 11:00 PM IST</p>
              <p className="text-[11px] text-slate-500">
                Active delivery dispatch 7 days a week across KGF.
              </p>
            </div>
          </div>

        </div>

        {/* Grievance Redressal Officer */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Grievance Redressal Officer
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            In compliance with Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:
          </p>
          <div className="space-y-1.5 text-xs text-slate-700 font-medium">
            <p><strong>Officer Name:</strong> Vishva D</p>
            <p><strong>Designation:</strong> Head of Customer Experience &amp; Compliance</p>
            <p><strong>Entity Name:</strong> Dhakav Designers</p>
            <p><strong>Address:</strong> #48, Tailor Shop Line, Oorgaum, KGF, Karnataka - 563120, India</p>
            <p><strong>Direct Email:</strong> <a href="mailto:contact.minnit@gmail.com" className="text-emerald-700 font-bold underline">contact.minnit@gmail.com</a></p>
            <p><strong>Direct Phone:</strong> <a href="tel:+918217649688" className="text-emerald-700 font-bold font-mono">+91 82176 49688</a></p>
          </div>
        </section>

        {/* Quick Message Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-slate-900 text-sm">Send us a Direct Message</h3>
          </div>

          {formSubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs space-y-1 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">Thank You for Reaching Out!</p>
              <p className="text-slate-600">
                Your message has been logged. Our KGF support team will respond to {email || 'your email'} shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vishva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number (optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 98450 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Message or Inquiry *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="How can we help with your order or delivery?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </LegalLayout>
  );
};
