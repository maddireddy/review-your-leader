'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ShieldCheck, TrendingUp } from 'lucide-react';

interface VerificationEvent {
  stateId: string;
  cm: string;
  party?: string;
  confidence: number;
  verifiedAt: string;
}

const STATE_NAMES: Record<string, string> = {
  KA: 'Karnataka', TN: 'Tamil Nadu', TG: 'Telangana', AP: 'Andhra Pradesh',
  MH: 'Maharashtra', GJ: 'Gujarat', UP: 'Uttar Pradesh', MP: 'Madhya Pradesh',
  RJ: 'Rajasthan', WB: 'West Bengal', DL: 'Delhi', KL: 'Kerala',
  BR: 'Bihar', HR: 'Haryana', PB: 'Punjab', AS: 'Assam',
  OD: 'Odisha', JH: 'Jharkhand', CG: 'Chhattisgarh', UK: 'Uttarakhand',
  HP: 'Himachal Pradesh', JK: 'J&K', GA: 'Goa', SK: 'Sikkim',
};

function getAgeStr(verifiedAt: string): string {
  const ageMs = Date.now() - new Date(verifiedAt).getTime();
  const age = Math.round(ageMs / 60000);
  return age < 60 ? `${age}m ago` : `${Math.round(age / 60)}h ago`;
}

export function LiveTicker() {
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [ageStr, setAgeStr] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(() => {
    try {
      const es = new EventSource('/api/live-events');
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'snapshot' && data.recent_verifications?.length > 0) {
            setEvents(data.recent_verifications);
            setCurrentIdx(0);
            setVisible(true);
          }
        } catch { /* ignore */ }
        es.close();
      };
      es.onerror = () => es.close();
    } catch { /* SSE not available */ }
  }, []);

  useEffect(() => {
    fetchEvents();
    const refetch = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(refetch);
  }, [fetchEvents]);

  // Update age string every minute to avoid calling Date.now() during render
  useEffect(() => {
    if (events.length === 0) return;
    const ev = events[currentIdx];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgeStr(ev ? getAgeStr(ev.verifiedAt) : '');
    const tick = setInterval(() => {
      const current = events[currentIdx];
      if (current) setAgeStr(getAgeStr(current.verifiedAt));
    }, 60_000);
    return () => clearInterval(tick);
  }, [events, currentIdx]);

  // Rotate ticker items every 4 seconds
  useEffect(() => {
    if (events.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrentIdx(i => (i + 1) % events.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [events]);

  if (!visible || events.length === 0) return null;

  const ev = events[currentIdx];
  const stateName = STATE_NAMES[ev.stateId] || ev.stateId;

  return (
    <div className="bg-black/60 border-b border-white/10 backdrop-blur-sm px-4 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Live badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Radio className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">Live</span>
        </div>

        <div className="h-3 w-px bg-white/20" />

        {/* Ticker content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-xs"
            >
              <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-white/70">
                <span className="text-white font-medium">{stateName}</span>
                {' '}verified CM:{' '}
                <span className="text-amber-300 font-medium">{ev.cm}</span>
                {ev.party && <span className="text-white/40"> ({ev.party})</span>}
              </span>
              <span className="text-white/30">·</span>
              <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-emerald-400">{Math.round(ev.confidence * 100)}% confidence</span>
              {ageStr && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-white/30">{ageStr}</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Counter */}
        <div className="shrink-0 text-white/20 text-xs">
          {currentIdx + 1}/{events.length}
        </div>
      </div>
    </div>
  );
}
