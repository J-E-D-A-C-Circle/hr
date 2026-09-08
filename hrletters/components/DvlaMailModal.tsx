'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Send, ExternalLink, X, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

interface DvlaMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter?: any;
  defaultEmail?: string;
  defaultSubject?: string;
  onSuccess?: () => void;
}

export const DvlaMailModal: React.FC<DvlaMailModalProps> = ({
  isOpen,
  onClose,
  letter,
  defaultEmail,
  defaultSubject,
  onSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('hr@dvla.gov.gh');
  const [subject, setSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSendSuccess(null);
    setErrorMsg(null);

    const staffEmail = letter?.staff?.email || defaultEmail || '';
    if (staffEmail && !staffEmail.includes('@dvla.gov.gh') && !staffEmail.includes('@')) {
      setRecipientEmail(`${staffEmail.toLowerCase().replace(/[^a-z0-9]/g, '')}@dvla.gov.gh`);
    } else {
      setRecipientEmail(staffEmail || 'constanceakua.essuman@dvla.gov.gh');
    }

    const docTitle = letter?.title || 'Official HR Document';
    const docRef = letter?.customRefNumber ? ` (${letter.customRefNumber})` : '';
    setSubject(defaultSubject || `[DVLA HR Official] ${docTitle}${docRef}`);
    setCustomMessage(
      `Please find attached official HR documentation from the Driver and Vehicle Licensing Authority (DVLA). Verification token: ${
        letter?.verificationCode || 'V-DVLA-GEN'
      }`
    );
  }, [isOpen, letter, defaultEmail, defaultSubject]);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMsg('Please enter a valid DVLA email address (e.g. name@dvla.gov.gh)');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/letters/send-dvla-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letterId: letter?.id || null,
          recipientEmail,
          ccEmail,
          customSubject: subject,
          customMessage,
          actorName: 'HR Officer',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSendSuccess(data.message || 'Email successfully dispatched to DVLA mail inbox.');
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to dispatch email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred while sending email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenWebmailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?cc=${encodeURIComponent(
      ccEmail
    )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(customMessage)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 h-full w-full z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Header */}
        <div className="bg-[#0F5132] text-white p-5 border-b-4 border-[#D97706] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">DVLA Mail Dispatcher</h3>
              <p className="text-xs text-emerald-100 font-medium">webmail.dvla.gov.gh Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {sendSuccess ? (
            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Check className="w-5 h-5" /> {sendSuccess}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                The letter correspondence has been transmitted. The audit log has been updated to reflect the DVLA mail dispatch.
              </p>
              <div className="pt-2 flex justify-end">
                <Button variant="success" size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Recipient DVLA Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                  Recipient DVLA Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. constanceakua.essuman@dvla.gov.gh"
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono transition outline-none focus:ring-2 focus:ring-emerald-500/30"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-1)' }}
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span>Quick Select:</span>
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('constanceakua.essuman@dvla.gov.gh')}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-bold hover:bg-emerald-500/20 border border-emerald-500/20 transition cursor-pointer"
                    >
                      constanceakua.essuman@dvla.gov.gh
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecipientEmail((prev) => (prev.includes('@') ? prev : `${prev}@dvla.gov.gh`))}
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    + Add @dvla.gov.gh
                  </button>
                </div>
              </div>

              {/* CC Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                  CC Copy Address
                </label>
                <input
                  type="text"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  placeholder="e.g. hr@dvla.gov.gh, records@dvla.gov.gh"
                  className="w-full px-3 py-2 rounded-lg border text-xs font-mono transition outline-none focus:ring-2 focus:ring-emerald-500/30"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-1)' }}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-medium transition outline-none focus:ring-2 focus:ring-emerald-500/30"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-1)' }}
                />
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                  Message / Cover Note
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-xs font-medium transition outline-none focus:ring-2 focus:ring-emerald-500/30"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-1)' }}
                />
              </div>

              {/* Document Summary Badge */}
              {letter && (
                <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold block text-gray-800 dark:text-gray-200">{letter.title}</span>
                    <span className="text-gray-500 font-mono">Code: {letter.verificationCode}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                    ATTACHED
                  </span>
                </div>
              )}

              {/* Gateway Banner */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>
                  Connects to DVLA Mail System at <strong>webmail.dvla.gov.gh</strong>.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!sendSuccess && (
          <div
            className="p-4 border-t flex items-center justify-between gap-3"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
          >
            <button
              type="button"
              onClick={handleOpenWebmailClient}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1.5 underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Launch Webmail Client
            </button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={handleSendEmail}
                disabled={isSending}
              >
                {isSending ? 'Sending to Webmail...' : 'Send via DVLA Mail'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
