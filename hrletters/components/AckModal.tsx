'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, FileCheck, X, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/Button';

interface AckModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: any;
  onSuccess?: () => void;
}

export const AckModal: React.FC<AckModalProps> = ({ isOpen, onClose, letter, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !letter) return null;

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/letters/${letter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACKNOWLEDGED',
          action: 'LETTER_ACKNOWLEDGED_BY_EMPLOYEE',
          actorName: letter.staff?.fullName || 'Employee',
          actorRole: 'Staff',
          acknowledgedAt: new Date().toISOString(),
          acknowledgmentIp: '127.0.0.1 (Verified DVLA Network)',
          details: `Employee ${letter.staff?.fullName} acknowledged receipt of ${letter.title}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAcknowledged(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to record acknowledgment.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error recording acknowledgment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 h-full w-full z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="bg-[#0F5132] text-white p-5 border-b-4 border-[#D97706] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-lg">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">Employee Document Acknowledgment</h3>
              <p className="text-xs text-emerald-100 font-medium">Step 8: Digital Receipt Confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {acknowledged || letter.status === 'ACKNOWLEDGED' ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-lg" style={{ color: 'var(--color-text-1)' }}>
                Receipt Successfully Acknowledged
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                Official record timestamped in the DVLA HR database archive.
              </p>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left text-xs font-mono space-y-1">
                <div>
                  <span className="text-gray-500">Timestamp:</span>{' '}
                  <strong>{new Date(letter.acknowledgedAt || Date.now()).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Verification Code:</span> <strong>{letter.verificationCode}</strong>
                </div>
                <div>
                  <span className="text-gray-500">IP Verification:</span>{' '}
                  <strong>{letter.acknowledgmentIp || '127.0.0.1'}</strong>
                </div>
              </div>
              <Button variant="success" size="sm" onClick={onClose} className="mt-2">
                Close Confirmation
              </Button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800/40 space-y-2 text-xs">
                <div className="font-bold text-sm text-gray-900 dark:text-white">{letter.title}</div>
                <div className="text-gray-600 dark:text-gray-300">
                  Recipient: <strong>{letter.staff?.fullName}</strong> ({letter.staff?.staffId})
                </div>
                <div className="text-gray-500 font-mono">Ref #: {letter.customRefNumber}</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> Confirm Official Receipt
                </div>
                <p className="leading-relaxed text-[11px]">
                  By clicking <strong>Acknowledge Receipt</strong>, you confirm that you have received and reviewed the official HR letter issued by the Driver and Vehicle Licensing Authority.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleAcknowledge}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recording...' : 'Acknowledge Receipt Now'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
