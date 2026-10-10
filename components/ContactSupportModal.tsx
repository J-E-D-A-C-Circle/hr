'use client';

import React, { useState } from 'react';
import { X, Send, HelpCircle, CheckCircle2, MessageSquare, User, Phone } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultContact?: string;
}

export default function ContactSupportModal({
  isOpen,
  onClose,
  defaultName = '',
  defaultContact = ''
}: ContactSupportModalProps) {
  const [name, setName] = useState(defaultName);
  const [contact, setContact] = useState(defaultContact);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!contact.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Same rule as registration: 10–15 digits (spaces, dashes and a leading + are ignored)
    const phone = contact.replace(/[\s\-()]/g, '').replace(/^\+/, '');
    if (!/^[0-9]{10,15}$/.test(phone)) {
      toast.error('Please enter a valid phone number (digits only, e.g. 0241234567)');
      return;
    }

    if (!message.trim()) {
      toast.error('Please describe your issue');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post('/api/support', {
        name: name.trim(),
        contact: phone,
        message: message.trim()
      });

      setSubmitted(true);
      toast.success('Support request submitted successfully!');
    } catch (error: any) {
      console.error('Failed to submit support request:', error);
      toast.error(error.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#0d5c2e] via-[#094824] to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20">
              <HelpCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Contact DVLA Support</h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                Submit an inquiry or describe an issue for our technical team
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#0d5c2e]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">Thank You!</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto font-medium">
              Your support request has been logged. Our technical team has been notified and will review your issue shortly.
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-[#0d5c2e] text-white text-xs font-extrabold shadow-sm hover:bg-emerald-800 transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0d5c2e]" /> Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Mensah"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#0d5c2e]" /> Phone Number *
              </label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                maxLength={20}
                value={contact}
                onChange={(e) => setContact(e.target.value.replace(/[^0-9+\s\-()]/g, ''))}
                placeholder="e.g. 0241234567"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#0d5c2e]" /> Describe Your Issue *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe the issue or problem you are experiencing in detail..."
                className="w-full p-3.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0d5c2e] focus:bg-white font-medium resize-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0d5c2e] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
