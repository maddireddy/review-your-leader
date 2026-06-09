'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, ChevronDown, ChevronUp, Loader2, Send, CheckCircle, Clock } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  upvotes: number;
  created_at: string;
}

type IssueCategory = 'roads' | 'water' | 'power' | 'healthcare' | 'education' | 'employment' | 'environment' | 'other';

const CATEGORIES: { value: IssueCategory; label: string; emoji: string }[] = [
  { value: 'roads', label: 'Roads', emoji: '🛣️' },
  { value: 'water', label: 'Water', emoji: '💧' },
  { value: 'power', label: 'Power', emoji: '⚡' },
  { value: 'healthcare', label: 'Health', emoji: '🏥' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'employment', label: 'Jobs', emoji: '💼' },
  { value: 'environment', label: 'Environment', emoji: '🌿' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

const STATUS_CONFIG = {
  open:        { color: '#EF4444', icon: <AlertTriangle className="w-3 h-3" />, label: 'Open' },
  in_progress: { color: '#F59E0B', icon: <Clock className="w-3 h-3" />, label: 'In Progress' },
  resolved:    { color: '#22C55E', icon: <CheckCircle className="w-3 h-3" />, label: 'Resolved' },
};

interface IssueTrackerProps {
  constituencyId: string;
  stateId: string;
  constituencyName: string;
}

export function IssueTracker({ constituencyId, stateId, constituencyName }: IssueTrackerProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'roads' as IssueCategory });

  useEffect(() => {
    fetch(`/api/issues?constituency_id=${encodeURIComponent(constituencyId)}`)
      .then(r => r.json())
      .then(d => setIssues(d.issues || []))
      .catch(() => {});
  }, [constituencyId]);

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constituency_id: constituencyId, state_id: stateId, ...form }),
      });
      const data = await res.json();
      if (data.issue) setIssues(prev => [data.issue, ...prev]);
      else setIssues(prev => [{ id: Date.now().toString(), title: form.title, category: form.category, status: 'open', upvotes: 1, created_at: new Date().toISOString() }, ...prev]);
      setForm({ title: '', category: 'roads' });
      setShowForm(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Local Issues
          </span>
          {issues.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {issues.filter(i => i.status === 'open').length} open
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* Issue list */}
              {issues.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-3">
                  No issues reported for {constituencyName} yet.
                </div>
              ) : (
                issues.slice(0, 5).map((issue, i) => {
                  const sc = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
                  const cat = CATEGORIES.find(c => c.value === issue.category);
                  return (
                    <motion.div
                      key={issue.id}
                      className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/30"
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    >
                      <span className="text-base mt-0.5">{cat?.emoji || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200 leading-tight truncate">{issue.title}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex items-center gap-0.5 text-[10px]" style={{ color: sc.color }}>
                            {sc.icon} {sc.label}
                          </div>
                          <span className="text-slate-600 text-[10px]">·</span>
                          <span className="text-[10px] text-slate-500">👍 {issue.upvotes}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Submit form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    className="space-y-2 pt-1"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex flex-wrap gap-1">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                          className={`text-[10px] px-2 py-1 rounded-lg transition-all ${form.category === cat.value ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800/60 text-slate-400 border border-slate-700/40'}`}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Describe the issue briefly…"
                      className="w-full px-3 py-2 text-xs bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                      maxLength={200}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowForm(false)}
                        className="flex-1 py-1.5 text-xs text-slate-400 border border-slate-700/60 rounded-lg hover:text-white transition-all">
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!form.title.trim() || submitting}
                        className="flex-1 py-1.5 text-xs font-medium text-white rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> Report</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-2 border border-dashed border-slate-600/60 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Report a local issue
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
