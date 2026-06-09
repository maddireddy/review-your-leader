'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { getPartyTheme } from '@/lib/colorSystem';

interface RatingBreakdown {
  accessibility: number;
  development: number;
  responsiveness: number;
  attendance: number;
}

interface CitizenRatingProps {
  repId: string;
  partyShort: string;
  repName: string;
}

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400 w-28">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className="w-4 h-4"
              fill={(hover || value) >= s ? '#FBBF24' : 'none'}
              color={(hover || value) >= s ? '#FBBF24' : '#475569'}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function AvgStars({ avg }: { avg: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className="w-3.5 h-3.5"
          fill={avg >= s ? '#FBBF24' : avg > s - 1 ? '#FBBF2488' : 'none'}
          color={avg >= s - 0.5 ? '#FBBF24' : '#475569'}
        />
      ))}
      <span className="text-xs text-slate-400 ml-1">{avg.toFixed(1)}</span>
    </div>
  );
}

export function CitizenRating({ repId, partyShort, repName }: CitizenRatingProps) {
  const theme = getPartyTheme(partyShort);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aggData, setAggData] = useState<{ avg: number | null; count: number; breakdown: RatingBreakdown | null }>({ avg: null, count: 0, breakdown: null });

  const [ratings, setRatings] = useState<RatingBreakdown>({
    accessibility: 0, development: 0, responsiveness: 0, attendance: 0,
  });

  useEffect(() => {
    fetch(`/api/ratings?rep_id=${encodeURIComponent(repId)}`)
      .then(r => r.json())
      .then(setAggData)
      .catch(() => {});
  }, [repId, submitted]);

  async function handleSubmit() {
    if (Object.values(ratings).some(v => v === 0)) return;
    setSubmitting(true);
    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ representative_id: repId, ...ratings }),
      });
      setSubmitted(true);
      setShowForm(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  return (
    <div className="glass-card p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ThumbsUp className="w-3.5 h-3.5" /> Citizen Ratings
        </h4>
        {aggData.count > 0 && (
          <div className="flex items-center gap-2">
            <AvgStars avg={aggData.avg ?? 0} />
            <span className="text-xs text-slate-500">({aggData.count})</span>
          </div>
        )}
      </div>

      {/* Breakdown bars */}
      {aggData.breakdown && (
        <div className="space-y-1.5 mb-3">
          {Object.entries({
            'Accessibility': aggData.breakdown.accessibility,
            'Dev Work': aggData.breakdown.development,
            'Responsiveness': aggData.breakdown.responsiveness,
            'Attendance': aggData.breakdown.attendance,
          }).map(([label, val]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-20">{label}</span>
              <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: theme.gradient }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(val / 5) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[10px] text-slate-400 w-6 text-right">{val.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Rate button / form */}
      <AnimatePresence>
        {submitted ? (
          <motion.div
            className="text-center py-2 text-xs text-green-400 font-medium"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            ✓ Rating submitted — thank you!
          </motion.div>
        ) : !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2 rounded-lg border border-slate-700/60 text-xs text-slate-400 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5" /> Rate {repName.split(' ').slice(-1)[0]}
          </button>
        ) : (
          <motion.div
            className="space-y-2.5"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          >
            <StarRow label="Accessibility" value={ratings.accessibility} onChange={v => setRatings(r => ({ ...r, accessibility: v }))} />
            <StarRow label="Dev Work" value={ratings.development} onChange={v => setRatings(r => ({ ...r, development: v }))} />
            <StarRow label="Responsiveness" value={ratings.responsiveness} onChange={v => setRatings(r => ({ ...r, responsiveness: v }))} />
            <StarRow label="Attendance" value={ratings.attendance} onChange={v => setRatings(r => ({ ...r, attendance: v }))} />

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-400 hover:text-white transition-all">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={Object.values(ratings).some(v => v === 0) || submitting}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                style={{ background: theme.gradient }}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3 h-3" /> Submit</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
