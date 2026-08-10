'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ScanLine, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/positions', label: 'Vacancies' },
    { href: '/status', label: 'Status' },
    { href: '/document-center', label: 'Doc Hub' },
  ];

  return (
    <header className="bg-[#0F5132] text-white shadow-lg border-b-2 border-[#D97706] sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Far Left: DVLA Official Logo & Brand Title */}
          <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white p-0.5 shadow-md border-2 border-amber-400 group-hover:scale-105 transition transform flex items-center justify-center">
              <Image
                src="/oop.png"
                alt="DVLA Ghana Official Logo"
                width={44}
                height={44}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg sm:text-xl tracking-wider text-white group-hover:text-amber-300 transition">
                DVLA
              </span>
              <span className="text-amber-400 font-extrabold text-sm sm:text-base tracking-tight whitespace-nowrap">
                Recruitment Portal
              </span>
              <span className="hidden lg:inline-block text-[10px] uppercase font-bold bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">
                Ghana
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex flex-1 justify-center items-center space-x-6 lg:space-x-8 text-sm font-bold">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`py-1 border-b-2 transition-all duration-200 ${isActive(href)
                    ? 'border-amber-400 text-amber-300 font-black'
                    : 'border-transparent text-emerald-100 hover:text-white hover:border-emerald-300/50'
                  }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/verify"
              className={`flex items-center gap-1.5 py-1 border-b-2 transition-all duration-200 ${isActive('/verify')
                  ? 'border-amber-400 text-amber-300 font-black'
                  : 'border-transparent text-amber-300 hover:text-white font-extrabold'
                }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              Verify QR
            </Link>
          </nav>

          {/* Balance spacer for centering on large displays */}
          <div className="hidden lg:block w-20 flex-shrink-0" />

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden p-2 rounded-lg text-white hover:bg-emerald-800 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0B3D26] border-t border-emerald-800 px-4 py-3 flex flex-col space-y-1 text-sm font-bold">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-lg transition-all ${isActive(href)
                  ? 'bg-emerald-900 text-amber-300 font-black'
                  : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/verify"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive('/verify')
                ? 'bg-emerald-900 text-amber-300 font-black'
                : 'text-amber-300 hover:bg-emerald-800 hover:text-white font-extrabold'
              }`}
          >
            <ScanLine className="w-4 h-4" />
            Verify QR
          </Link>
        </div>
      )}
    </header>
  );
}
