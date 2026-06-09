'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { LOCALES } from '@/lib/i18n/translations';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find(l => l.code === locale);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current?.native}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
            >
              {LOCALES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/80 transition-colors text-left border-b border-slate-800/50 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{l.native}</div>
                    <div className="text-[10px] text-slate-500">{l.name}</div>
                  </div>
                  {l.code === locale && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
