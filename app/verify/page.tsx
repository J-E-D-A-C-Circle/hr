'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, QrCode, Search, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { verifyAppointmentLetterCode } from '@/app/actions/appointmentVerification';

export default function VerifySearchPage() {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;

    setIsVerifying(true);
    setErrorMsg(null);

    const res = await verifyAppointmentLetterCode(codeInput.trim());
    setIsVerifying(false);

    if (res.success && res.appointmentLetter) {
      router.push(`/verify/${res.appointmentLetter.verificationCode}`);
    } else {
      setErrorMsg(res.error || 'No matching appointment letter found.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full flex flex-col justify-center">
        {/* Verification Shield Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 bg-emerald-900 text-amber-300 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>DVLA Identity & Trust Verification Portal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">
            Verify Appointment Letter Authenticity
          </h1>
          <p className="text-gray-600 text-sm max-w-xl mx-auto">
            Banks, employers, and authorized institutions can scan the QR code on any DVLA appointment letter or enter the unique verification reference below to confirm validity.
          </p>
        </div>

        {/* Verification Input Box */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border-2 border-emerald-900/20 max-w-2xl mx-auto w-full space-y-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <label className="block text-xs font-black uppercase text-emerald-950 tracking-wider">
              Enter Verification Code or Reference Number
            </label>

            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="e.g. DVLA-VER-2026-X9K82 or DVLA-2026-KM92A"
                className="w-full border-2 border-emerald-800 rounded-2xl px-5 py-4 text-base font-mono font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-600/30 uppercase"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="absolute right-2.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold px-6 py-3 rounded-xl text-sm transition shadow flex items-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  'Verifying...'
                ) : (
                  <>
                    <span>Verify</span>
                    <Search className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1">
              <QrCode className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>You can also point your mobile camera at the QR code on the physical appointment letter.</span>
            </div>
          </form>

          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-xl text-red-900 font-bold text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Shortcuts */}
          <div className="border-t border-gray-200 pt-5 text-center space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Try Sample Reference Lookup</span>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setCodeInput('DVLA-2026-KM92A')}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-[#0F5132] font-mono font-bold px-3 py-1.5 rounded-lg border border-emerald-300 transition"
              >
                DVLA-2026-KM92A
              </button>
              <button
                type="button"
                onClick={() => setCodeInput('DVLA-2026-AO48B')}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-[#0F5132] font-mono font-bold px-3 py-1.5 rounded-lg border border-emerald-300 transition"
              >
                DVLA-2026-AO48B
              </button>
            </div>
          </div>
        </div>
      </main>


    </div>
  );
}
