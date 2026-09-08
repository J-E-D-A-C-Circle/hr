'use client';

import React from 'react';
import Image from 'next/image';
import { UserCheck, Shield, Building2, User, Key, CheckCircle, ArrowRight, Sparkles, Lock } from 'lucide-react';
import { RoleType } from '../Navbar';

interface LoginViewProps {
  onLogin: (role: RoleType | 'STAFF', userDetails?: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  return (
    <div className="min-h-[82vh] flex flex-col justify-center items-center py-6 px-4 animate-fade-up">
      {/* Header Banner */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider shadow-sm">
          <Lock className="w-3.5 h-3.5" /> Secure Authority Portal
        </div>

        <div className="flex items-center justify-center gap-3 my-2">
          <div className="relative w-12 h-12 shrink-0">
            <Image src="/oop.png" alt="DVLA Seal" fill sizes="48px" className="object-contain" priority />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-1)' }}>
            DVLA HR Letters & Staff Portal
          </h1>
        </div>

        <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
          Select a demo persona below to test complete Role-Based Access Control (RBAC) and tailored workflow interfaces.
        </p>
      </div>

      {/* Demo Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 w-full max-w-6xl">
        {/* Persona 1: HR Officer */}
        <div
          className="group card p-6 flex flex-col justify-between hover:border-emerald-600/50 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden"
          onClick={() => onLogin('HR_OFFICER')}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition" />
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Drafting & Records
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                  LEVEL 1
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--color-text-1)' }}>
                HR Officer
              </h3>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
                Pre-register staff records, compose letters from templates, auto-fill tags, and submit letters for manager approval.
              </p>
            </div>

            <div className="pt-2 border-t space-y-1 text-[11px]" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Staff Pre-registration (Step 1)
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Letter Drafting & Editing
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> DVLA Mail Dispatch
              </div>
            </div>
          </div>

          <button className="mt-6 w-full py-2.5 px-4 rounded-lg bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition group-hover:translate-x-0.5">
            Login as HR Officer <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Persona 2: HR Director */}
        <div
          className="group card p-6 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden"
          onClick={() => onLogin('HR_DIRECTOR')}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition" />
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Executive Signatory
                </span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                  LEVEL 3
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--color-text-1)' }}>
                HR Director
              </h3>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
                Authorized officer to review pending approvals, attach digital signature, issue official documents, and view full audit logs.
              </p>
            </div>

            <div className="pt-2 border-t space-y-1 text-[11px]" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                <CheckCircle className="w-3 h-3" /> Letter Approvals (Step 4)
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                <CheckCircle className="w-3 h-3" /> Digital Sign & Issue (Step 5)
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                <CheckCircle className="w-3 h-3" /> Complete Audit Trail
              </div>
            </div>
          </div>

          <button className="mt-6 w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition group-hover:translate-x-0.5">
            Login as HR Director <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Persona 3: Department Head */}
        <div
          className="group card p-6 flex flex-col justify-between hover:border-emerald-600/50 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden"
          onClick={() => onLogin('DEPT_HEAD')}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition" />
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Recommender
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                  LEVEL 2
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--color-text-1)' }}>
                Department Head
              </h3>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
                View departmental staff recommendations, track placement progress, and access the secure digital archive.
              </p>
            </div>

            <div className="pt-2 border-t space-y-1 text-[11px]" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Department Staff View
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Letter Recommender Chain
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Archive Lookup
              </div>
            </div>
          </div>

          <button className="mt-6 w-full py-2.5 px-4 rounded-lg bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition group-hover:translate-x-0.5">
            Login as Dept Head <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Persona 4: Employee / Staff Portal */}
        <div
          className="group card p-6 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden"
          onClick={() =>
            onLogin('STAFF', {
              id: 'staff-constance',
              fullName: 'Constance Akua Essuman',
              staffId: 'DVLA-883012',
              email: 'constanceakua.essuman@dvla.gov.gh',
              department: 'Driver Licensing & Executive Administration',
              jobTitle: 'Senior Licensing & HR Director',
            })
          }
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition" />
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Employee Self-Service
                </span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                  PORTAL USER
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--color-text-1)' }}>
                Constance Akua Essuman
              </h3>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
                Log in to Staff Portal (constanceakua.essuman@dvla.gov.gh) to view issued letters, download official PDFs, and Acknowledge Receipt.
              </p>
            </div>

            <div className="pt-2 border-t space-y-1 text-[11px]" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                <CheckCircle className="w-3 h-3" /> View Issued HR Documents
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                <CheckCircle className="w-3 h-3" /> Acknowledge Receipt (Step 8)
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                <CheckCircle className="w-3 h-3" /> Verification QR Access
              </div>
            </div>
          </div>

          <button className="mt-6 w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition group-hover:translate-x-0.5">
            Login as Employee Portal <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
