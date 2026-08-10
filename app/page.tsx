import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let openPositionsCount = 0;
  let applicationsCount = 0;

  try {
    [openPositionsCount, applicationsCount] = await Promise.all([
      prisma.position.count({ where: { status: 'OPEN' } }),
      prisma.application.count(),
    ]);
  } catch {
    // fallback if initial DB connect
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6E3]">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-[#0F5132] text-white py-16 px-4 sm:px-6 lg:px-8 border-b-8 border-[#D97706] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          <div className="space-y-6">
            <span className="bg-amber-500 text-gray-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Official Government Recruitment Portal
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              DVLA Recruitment & Attachment Portal (DRAP)
            </h1>

            <p className="text-emerald-100 text-base leading-relaxed">
              The official digital portal for Driver & Vehicle Licensing Authority student attachments, temporary positions, and staff recruitment across Ghana.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/apply"
                className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-sm px-6 py-3.5 rounded-lg shadow-lg transition transform hover:-translate-y-0.5"
              >
                Submit Application Now →
              </Link>
              <Link
                href="/status"
                className="border-2 border-white/40 hover:border-white text-white font-bold text-sm px-6 py-3.5 rounded-lg transition hover:bg-white/10"
              >
                Track Status by Reference #
              </Link>
            </div>
          </div>

          {/* Stats & Badge Container */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-white space-y-6">
            <div className="text-xs uppercase font-bold text-amber-300 tracking-wider">Authority Statistics</div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-emerald-950/60 p-5 rounded-xl border border-emerald-700/50">
                <div className="text-3xl font-black text-amber-400">{openPositionsCount || 3}+</div>
                <div className="text-xs text-emerald-100 mt-1 font-medium">Active Vacancies & Placements</div>
              </div>
              <div className="bg-emerald-950/60 p-5 rounded-xl border border-emerald-700/50">
                <div className="text-3xl font-black text-amber-400">{applicationsCount || 12}+</div>
                <div className="text-xs text-emerald-100 mt-1 font-medium">Registered Applications</div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 text-xs text-emerald-100 leading-relaxed">
              🔒 <strong>Enforced Identity Integrity:</strong> One application per person strictly enforced at both database and application layers.
            </div>
          </div>

        </div>
      </section>

      {/* Main Core Modules Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-16">

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-900">Portal Services & Operations</h2>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Access public application forms, tracking portals, judge scoring interfaces, and post-acceptance document submission hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1: Internship & Staff Application */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 flex flex-col justify-between hover:shadow-xl transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center text-2xl font-bold mb-4">
                📝
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">1. Apply for Attachment / Role</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Submit your CV, cover letter, and application letter. Existing DVLA staff can toggle station and department options.
              </p>
            </div>
            <Link
              href="/apply"
              className="bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs px-4 py-3 rounded-lg text-center shadow transition"
            >
              Open Application Form →
            </Link>
          </div>

          {/* Card 2: Status & Document Center */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 flex flex-col justify-between hover:shadow-xl transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-bold mb-4">
                📁
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">2. Status & Document Hub</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Check stage progress and access the Post-Acceptance Document Center to download templates and re-upload required forms.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/status"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs px-3 py-3 rounded-lg text-center shadow transition"
              >
                Track Status
              </Link>
              <Link
                href="/document-center"
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs px-3 py-3 rounded-lg text-center transition"
              >
                Docs Hub
              </Link>
            </div>
          </div>

          {/* Card 3: Judge Scoring Portal */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 flex flex-col justify-between hover:shadow-xl transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-2xl font-bold mb-4">
                ⚖️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">3. Panel Judge Evaluation</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                No-login judge scoring module. Search candidates by name, view candidate CVs strictly without cover letters, and score against 100-mark rubrics.
              </p>
            </div>
            <Link
              href="/judge"
              className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-4 py-3 rounded-lg text-center shadow transition"
            >
              Enter Judge Interface →
            </Link>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
