'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Map, User, Building2 } from 'lucide-react';
import { RepPhoto } from '@/components/UI/RepPhoto';

interface SearchResult {
  type: 'state' | 'representative' | 'constituency' | 'district';
  id: string;
  name: string;
  subtitle?: string;
  score?: number;
  wikipedia_slug?: string;
}

interface SearchBarProps {
  onStateSelect?: (stateId: string) => void;
  onRepSelect?: (repId: string) => void;
}

const TYPE_ICON = {
  state: <Map className="w-3.5 h-3.5 text-amber-400" />,
  representative: <User className="w-3.5 h-3.5 text-indigo-400" />,
  constituency: <Building2 className="w-3.5 h-3.5 text-green-400" />,
  district: <Building2 className="w-3.5 h-3.5 text-slate-400" />,
};

export function SearchBar({ onStateSelect, onRepSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  function handleSelect(r: SearchResult) {
    setOpen(false);
    setQuery('');
    if (r.type === 'state' && onStateSelect) onStateSelect(r.id);
    if (r.type === 'representative' && onRepSelect) onRepSelect(r.id);
  }

  return (
    <div className="relative w-full max-w-sm">
      {/* Input */}
      <div className="relative flex items-center">
        {loading
          ? <Loader2 className="absolute left-3 w-4 h-4 text-slate-400 animate-spin" />
          : <Search className="absolute left-3 w-4 h-4 text-slate-500" />}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search MPs, states, constituencies…"
          className="w-full pl-9 pr-8 py-2 text-sm bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="absolute right-2.5 text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {results.map((r, i) => (
              <motion.button
                key={r.id}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/80 transition-colors text-left border-b border-slate-800/60 last:border-0"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {r.type === 'representative' ? (
                  <RepPhoto
                    name={r.name}
                    party_short={(r.subtitle?.split('·')[0] ?? '').trim()}
                    wikipedia_slug={r.wikipedia_slug}
                    size={28}
                    showRing={false}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {TYPE_ICON[r.type] ?? <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">{r.name}</div>
                  {r.subtitle && <div className="text-xs text-slate-500 truncate mt-0.5">{r.subtitle}</div>}
                </div>
                {r.score && r.score > 0.9 && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Top</span>
                )}
              </motion.button>
            ))}
            <div className="px-3 py-1.5 text-[10px] text-slate-600 border-t border-slate-800/60">
              Powered by Voyage AI semantic search + ECI data
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
