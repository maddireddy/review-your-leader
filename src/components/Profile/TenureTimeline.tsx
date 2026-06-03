'use client';

import { motion } from 'framer-motion';
import { Representative } from '@/types';
import { CheckCircle, Clock } from 'lucide-react';

// Mock tenure history
function getMockTenure(rep: Representative) {
  return [
    {
      period: `2024 – Present`,
      constituency: rep.constituency_name,
      type: rep.constituency_type,
      party: rep.party_short,
      partyColor: rep.party_color,
      isCurrent: true,
      votes: '1,23,456',
      margin: '45,678',
    },
    {
      period: '2019 – 2024',
      constituency: rep.constituency_name,
      type: rep.constituency_type,
      party: rep.party_short,
      partyColor: rep.party_color,
      isCurrent: false,
      votes: '1,15,234',
      margin: '38,921',
    },
    {
      period: '2014 – 2019',
      constituency: rep.constituency_name,
      type: rep.constituency_type,
      party: 'INC',
      partyColor: '#19AAED',
      isCurrent: false,
      votes: '98,432',
      margin: '12,105',
    },
  ];
}

interface TenureTimelineProps {
  representative: Representative;
}

export function TenureTimeline({ representative }: TenureTimelineProps) {
  const tenure = getMockTenure(representative);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-300">Election History</h4>
      <div className="relative pl-5">
        {/* Timeline line */}
        <div className="absolute left-2 top-3 bottom-3 w-px bg-slate-700/60" />

        <div className="space-y-4">
          {tenure.map((entry, idx) => (
            <motion.div
              key={idx}
              className="relative"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* Dot */}
              <div
                className={`absolute -left-3.5 top-3 w-3 h-3 rounded-full border-2 ${
                  entry.isCurrent
                    ? 'bg-green-400 border-green-400 shadow-lg shadow-green-400/40'
                    : 'bg-slate-600 border-slate-500'
                }`}
              />

              <div className={`glass-card p-3 ${entry.isCurrent ? 'border-green-500/20' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-white">{entry.period}</span>
                  <div className="flex items-center gap-1.5">
                    {entry.isCurrent && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Current
                      </span>
                    )}
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md font-bold text-white"
                      style={{ backgroundColor: entry.partyColor }}
                    >
                      {entry.party}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400">{entry.constituency}</div>
                <div className="flex gap-4 mt-2 text-xs">
                  <div>
                    <span className="text-slate-500">Votes: </span>
                    <span className="text-slate-200 font-medium">{entry.votes}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Margin: </span>
                    <span className="text-green-400 font-medium">{entry.margin}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass-card p-3 text-xs text-slate-400 flex items-start gap-2">
        <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
        Historical election data. Connect to Supabase with Election Commission data for verified records.
      </div>
    </div>
  );
}
