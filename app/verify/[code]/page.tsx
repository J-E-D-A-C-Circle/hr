import { verifyAppointmentLetterCode } from '@/app/actions/appointmentVerification';
import Navbar from '@/components/Navbar';

import OfficialAppointmentLetter from '@/components/OfficialAppointmentLetter';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Printer, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  const { code } = resolvedParams;

  const res = await verifyAppointmentLetterCode(code);

  if (!res.success || !res.appointmentLetter) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center space-y-6 w-full">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-2 border-red-300">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Verification Failed</h1>
          <p className="text-gray-600 text-sm">{res.error || 'Invalid or revoked verification code.'}</p>
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 bg-[#0F5132] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#0B3D26] transition shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Verification Portal
          </Link>
        </main>
      </div>
    );
  }

  const letter = res.appointmentLetter;
  const app = letter.application;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full space-y-6">
        
        {/* Verification Top Banner Actions */}
        <div className="no-print bg-emerald-950 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center font-black text-xl shrink-0">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-300 uppercase tracking-wide">OFFICIALLY VERIFIED</span>
                <span className="bg-emerald-800 text-emerald-100 text-xs font-mono px-2 py-0.5 rounded border border-emerald-600">
                  {letter.verificationCode}
                </span>
              </div>
              <div className="text-xs text-emerald-200 mt-0.5">
                Authentic DVLA Ghana Appointment Record issued for <strong>{app.applicant.fullName}</strong>.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition"
            >
              Verify Another Code
            </Link>
          </div>
        </div>

        {/* Render Official DVLA Appointment Letterhead */}
        <OfficialAppointmentLetter
          referenceNumber={app.referenceNumber}
          verificationCode={letter.verificationCode}
          applicantName={app.applicant.fullName}
          positionTitle={app.position.title}
          departmentName={app.department.name}
          postingStationName={app.station?.name || 'Head Office (Accra 37)'}
          effectiveDate={letter.effectiveDate || 'Monday, August 3, 2026'}
          issueDate={new Date(letter.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
          customRefNumber={letter.customRefNumber || undefined}
          customSubject={letter.customSubject || undefined}
          customBodyText={letter.customBodyText || undefined}
          signatoryName={letter.signatoryName || undefined}
          signatoryTitle={letter.signatoryTitle || undefined}
          status={letter.status}
        />
      </main>


    </div>
  );
}
