"use client";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UploadCloud, DownloadCloud, LogOut } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', active: true },
  { label: 'Onboarding', active: false },
  { label: 'Privacy', active: false },
];

export default function Dashboard() {
  const router = useRouter();
  // Simulate user info for now
  const user = { name: 'Kingston Kofi Agyemang' };

  return (
    <div className="min-h-screen flex bg-[#f7f9f9]">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col min-h-screen w-64 bg-[#17803f]">
        <div className="pt-7 pb-6 px-7 flex flex-col items-center">
          <Image src="/oop.png" width={56} height={56} alt="DVLA Logo" className="mb-5 rounded-full bg-white/80 p-1 shadow" />
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-4">
          {NAV.map(n => (
            <div
              key={n.label}
              className={`flex items-center font-medium text-base rounded-lg px-3 py-3 mb-1 cursor-pointer transition select-none 
                ${n.active ? 'bg-[#19964e] text-white shadow-sm' : 'text-white/85 hover:bg-[#15803d]/80'}`}
            >
              <span className="mr-2 text-lg">
                {n.label === 'Dashboard' && <UploadCloud className="w-5 h-5 inline" />}
                {n.label === 'Onboarding' && <DownloadCloud className="w-5 h-5 inline" />}
                {n.label === 'Privacy' && <span className="inline-block w-4 h-4" />} {/* Use a true icon if available */}
              </span>
              <span>{n.label}</span>
            </div>
          ))}
        </nav>
        <div className="mt-auto mb-3 px-4">
          <button className="flex items-center gap-2 text-white/80 hover:bg-[#15803d] px-3 py-2 rounded-md w-full font-semibold transition">
            <LogOut className="w-5 h-5" /> Sign out
          </button>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen px-4 md:px-0 bg-[#f7f9f9]">
        <div className="max-w-6xl w-full mx-auto py-10 px-0 md:px-6">
          <div className="mt-4 mb-8">
            <div className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-1">Welcome, {user.name}</div>
            <div className="text-lg md:text-xl text-gray-700 mb-2">Your National Service application portal.</div>
            <div className="my-7">
              <div className="bg-[#f9f4e5] text-[#8a8352] rounded-xl px-6 py-4 text-base font-semibold text-center w-fit md:w-auto">
                Your application is pending
              </div>
            </div>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {[
              {
                icon: <UploadCloud className="w-8 h-8 text-emerald-400" />, title: 'Application Form',
                desc: 'Start your application to get enrolled into the NSS Program at The Driver and Vehicle Licensing Authority.',
                cta: 'Start Application',
                disabled: false
              },
              {
                icon: <DownloadCloud className="w-8 h-8 text-emerald-400" />, title: 'Download Appointment Letter',
                desc: 'Download your appointment letter to get started at DVLA',
                cta: 'Download Letter',
                disabled: true
              },
              {
                icon: <UploadCloud className="w-8 h-8 text-emerald-400" />, title: 'NSS district approved appointment form',
                desc: 'Upload your appointment form to complete your enrollment into the NSS Program at the DVLA.',
                cta: 'Upload Form',
                disabled: false
              },
              {
                icon: <DownloadCloud className="w-8 h-8 text-emerald-400" />, title: 'Download Reposting Letter',
                desc: 'Download your reposting letter to send to the NSS secretariat',
                cta: 'Download Letter',
                disabled: true
              },
            ].map((card, i) => (
              <div key={card.title} className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-7 flex flex-col gap-2 items-start min-h-[210px]">
                <div className="mb-2">{card.icon}</div>
                <div className="text-base font-bold mb-1">{card.title}</div>
                <div className="text-[15px] text-gray-600 mb-3">{card.desc}</div>
                <Button
                  disabled={card.disabled}
                  className="mt-auto px-6 py-2 rounded-full text-white font-semibold bg-[#16a34a] disabled:bg-gray-200 disabled:text-gray-400 shadow-sm"
                >{card.cta}</Button>
              </div>
            ))}
          </div>
        </div>
        {/* User mini-profile desktop */}
        <div className="hidden md:flex items-center absolute top-6 right-10">
          <div className="rounded-full bg-emerald-700 text-white font-bold w-11 h-11 flex items-center justify-center mr-2">KA</div>
          <span className="text-gray-800 font-semibold">Kingston Agyemang</span>
        </div>
      </div>
    </div>
  );
}

