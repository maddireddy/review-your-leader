'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, ChevronUp, Bell, BellRing, MapPin } from 'lucide-react';
import { getUpcomingElections, daysUntil, ElectionEvent } from '@/lib/electionCalendar';

const TYPE_LABEL: Record<ElectionEvent['type'], string> = {
  assembly: 'Assembly',
  lok_sabha: 'Lok Sabha',
  by_election: 'By-election',
  local_body: 'Local Body',
  rajya_sabha: 'Rajya Sabha',
};

const STATUS_COLOR = {
  announced: '#22C55E',
  expected: '#F59E0B',
  tentative: '#6B7280',
};

export function ElectionCalendar() {
  const elections = getUpcomingElections();
  const [expanded, setExpanded] = useState(false);
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());

  async function toggleNotify(id: string) {
    const next = new Set(subscribed);
    if (next.has(id)) {
      next.delete(id);
    } else {
      // Request Web Push permission
      if ('Notification' in window && Notification.permission !== 'granted') {
        try { await Notification.requestPermission(); } catch { /* ignore */ }
      }
      next.add(id);
    }
    setSubscribed(next);
  }

  const visible = expanded ? elections : elections.slice(0, 3);

  return (
    <div className="glass-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-slate-200">Election Calendar</span>
          <span className="bg-violet-500/20 text-violet-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {elections.length} upcoming
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      <div className="px-3 pb-3 space-y-2">
        {visible.map((e, i) => {
          const days = daysUntil(e.expected_date);
          const isSub = subscribed.has(e.id);
          return (
            <motion.div
              key={e.id}
              className="rounded-xl p-3 bg-slate-800/40 border border-slate-700/40"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: `${STATUS_COLOR[e.status]}22`, color: STATUS_COLOR[e.status] }}>
                      {TYPE_LABEL[e.type]}
                    </span>
                    {e.seats && <span className="text-[10px] text-slate-500">{e.seats} seats</span>}
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1 leading-tight">{e.title}</h4>
                  {e.state && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {e.state}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{e.description}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-violet-400">{days > 0 ? days : '—'}</div>
                  <div className="text-[9px] text-slate-500">{days > 0 ? 'days' : 'TBD'}</div>
                  <button
                    onClick={() => toggleNotify(e.id)}
                    className={`mt-1.5 p-1 rounded-lg transition-all ${isSub ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-700/40 text-slate-500 hover:text-slate-300'}`}
                    title={isSub ? 'Notifications on' : 'Notify me'}
                  >
                    {isSub ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {!expanded && elections.length > 3 && (
          <button onClick={() => setExpanded(true)}
            className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            +{elections.length - 3} more elections
          </button>
        )}
      </div>
    </div>
  );
}
