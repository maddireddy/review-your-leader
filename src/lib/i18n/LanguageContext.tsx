'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Locale, t as translate } from './translations';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load saved / browser-detected language — deferred to avoid cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('ryl_locale') as Locale | null;
      if (saved) { setLocaleState(saved); return; }
      const browser = navigator.language.split('-')[0];
      const supported: Locale[] = ['en', 'hi', 'te', 'ta', 'kn', 'mr'];
      if (supported.includes(browser as Locale)) {
        setLocaleState(browser as Locale);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('ryl_locale', l);
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
