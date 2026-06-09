'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Menu, X, BarChart3 } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-2xl border-b border-indigo-500/10 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 transition-shadow">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-orange-500 to-indigo-600 blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg tracking-tight text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                Review<span className="text-orange-400">Your</span>Leader
              </span>
              <span className="text-[10px] text-slate-400 tracking-widest uppercase">Know Your Representatives</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Explore Map
            </Link>
            <Link href="/dashboard/parties" className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <Link href="/about" className="text-sm text-slate-300 hover:text-white transition-colors">
              About
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              className="md:hidden text-slate-300 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800/60 bg-slate-950/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" className="block text-sm text-slate-300 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              Explore Map
            </Link>
            <Link href="/dashboard/parties" className="block text-sm text-slate-300 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            <Link href="/about" className="block text-sm text-slate-300 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              About
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
