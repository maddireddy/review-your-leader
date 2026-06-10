'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, TrendingUp, Users, Award, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, Loader2,
  Scale, BookOpen, Calendar, MapPin, Percent,
  ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
interface ElectionResult {
  id: number;
  cycle_id: string;
  constituency_name: string;
  constituency_id: string;
  candidate_name: string;
  candidate_gender?: string;
  party: string;
  party_short?: string;
  votes: number;
  vote_share: number;
  margin: number;
  position: number;
  is_winner: boolean;
  total_votes_cast: number;
  total_electors: number;
  turnout_percent: number;
}

interface PartyTrend {
  cycle_id: string;
  party: string;
  party_short?: string;
  seats_won: number;
  seats_contested: number;
  vote_share: number;
  seats_change?: number;
  vote_share_change?: number;
  election_cycles?: { year: number; total_seats: number };
}

interface TurnoutPoint {
  election_year: number;
  election_type: string;
  turnout_percent: number;
  votes_polled: number;
  total_electors: number;
}

interface CandidateProfile {
  candidate_name: string;
  party: string;
  constituency: string;
  total_assets: number;
  total_liabilities: number;
  criminal_cases: number;
  serious_criminal_cases: number;
  education: string;
  age: number;
  affidavit_url?: string;
}

interface ElectionHistoryProps {
  stateId: string;
  stateName: string;
  year?: number;
  constituencyId?: string;
  defaultTab?: 'results' | 'trends' | 'affidavits';
}

// ── Party color palette ──────────────────────────────────────
const PARTY_COLORS: Record<string, string> = {
  BJP: '#FF6B00', INC: '#00A86B', AAP: '#00BFFF', DMK: '#CC0000',
  ADMK: '#006600', TMC: '#22C55E', SP: '#E53935', BSP: '#2196F3',
  NCP: '#FF9800', SS: '#FF5722', RJD: '#7B1FA2', JDU: '#FFC107',
  TDP: '#FFEB3B', YSR: '#4CAF50', BJD: '#009688', CPM: '#F44336',
  CPI: '#E91E63', JDS: '#795548',
};
function partyColor(party: string): string {
  return PARTY_COLORS[party?.toUpperCase()] ?? '#6366f1';
}

function formatCrore(n: number): string {
  if (!n) return '₹0';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString()}`;
}

// ── VoteBar ──────────────────────────────────────────────────
function VoteBar({ candidate, maxVotes, partyCol }: {
  candidate: ElectionResult; maxVotes: number; partyCol: string;
}) {
  const pct = maxVotes > 0 ? (candidate.votes / maxVotes) * 100 : 0;
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${candidate.is_winner ? 'bg-white/6 border border-white/10' : 'hover:bg-white/3'}`}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: (candidate.is_winner ? partyCol + '30' : 'transparent'), color: partyCol, border: `1px solid ${partyCol}40` }}>
        {candidate.position}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            {candidate.is_winner && <Award className="w-3 h-3 text-amber-400" />}
            <span className="text-xs font-semibold text-white truncate">{candidate.candidate_name}</span>
            {candidate.candidate_gender === 'Female' && <span className="text-pink-400 text-[10px]">♀</span>}
          </div>
          <span className="text-xs text-slate-400 shrink-0 ml-2">{candidate.vote_share?.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: partyCol }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: candidate.position * 0.05 }}
            />
          </div>
          <span className="text-[10px] text-slate-500 shrink-0 w-16 text-right">
            {candidate.votes?.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: partyCol + '20', color: partyCol }}>
            {candidate.party_short || candidate.party}
          </span>
          {candidate.is_winner && candidate.margin > 0 && (
            <span className="text-[10px] text-emerald-400">+{candidate.margin.toLocaleString()} margin</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TurnoutSparkline ─────────────────────────────────────────
function TurnoutSparkline({ data }: { data: TurnoutPoint[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.turnout_percent));
  const min = Math.min(...data.map(d => d.turnout_percent));
  const range = max - min || 1;
  const W = 200; const H = 48;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.turnout_percent - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12">
        <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * W;
          const y = H - ((d.turnout_percent - min) / range) * (H - 8) - 4;
          return <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        {data.map((d, i) => <span key={i}>{d.election_year}</span>)}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export function ElectionHistory({
  stateId, stateName, year, constituencyId, defaultTab = 'results'
}: ElectionHistoryProps) {
  const [tab, setTab] = useState<'results' | 'trends' | 'affidavits'>(defaultTab);
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [partyTrends, setPartyTrends] = useState<PartyTrend[]>([]);
  const [turnout, setTurnout] = useState<TurnoutPoint[]>([]);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedConstituency, setExpandedConstituency] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(year || 0);
  const [availableYears] = useState([2024, 2019, 2014, 2009]);

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ stateId, type: 'assembly', top: '200' });
      if (selectedYear) params.set('year', String(selectedYear));
      if (constituencyId) params.set('constituencyId', constituencyId);
      const res = await fetch(`/api/electoral/results?${params}`);
      const d = await res.json();
      setResults(d.results ?? []);
    } catch { setResults([]); }
    setLoading(false);
  }, [stateId, selectedYear, constituencyId]);

  const loadTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/electoral/trends?stateId=${stateId}`);
      const d = await res.json();
      setPartyTrends(d.partyTrends ?? []);
      setTurnout(d.turnoutHistory ?? []);
    } catch { /* */ }
    setLoading(false);
  }, [stateId]);

  const loadAffidavits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ stateId });
      if (selectedYear) params.set('year', String(selectedYear));
      const res = await fetch(`/api/electoral/candidates?${params}`);
      const d = await res.json();
      setCandidates(d.candidates ?? []);
    } catch { setCandidates([]); }
    setLoading(false);
  }, [stateId, selectedYear]);

  useEffect(() => {
    if (tab === 'results')    loadResults();
    if (tab === 'trends')     loadTrends();
    if (tab === 'affidavits') loadAffidavits();
  }, [tab, loadResults, loadTrends, loadAffidavits]);

  // Group results by constituency
  const byConstituency = results.reduce<Record<string, ElectionResult[]>>((acc, r) => {
    const key = r.constituency_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const constituencies = Object.entries(byConstituency).sort(([, a], [, b]) =>
    (a[0]?.constituency_name ?? '').localeCompare(b[0]?.constituency_name ?? ''));

  const tabs = [
    { id: 'results',    icon: BarChart2,   label: 'Results' },
    { id: 'trends',     icon: TrendingUp,  label: 'Trends' },
    { id: 'affidavits', icon: Scale,       label: 'Affidavits' },
  ] as const;

  return (
    <div className="space-y-3">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-sm font-bold text-white">Electoral History</span>
          <span className="text-xs text-slate-500">· {stateName}</span>
        </div>
        {/* Year selector */}
        <div className="flex gap-1">
          {availableYears.map(y => (
            <button key={y}
              onClick={() => setSelectedYear(selectedYear === y ? 0 : y)}
              className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-all ${
                selectedYear === y ? 'bg-violet-500/30 text-violet-300 border border-violet-500/40' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >{y}</button>
          ))}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/40">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.id ? 'bg-violet-500/20 text-violet-300 border border-violet-500/25' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Loading ──────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Fetching electoral data…</span>
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── RESULTS TAB ─────────────────────────────────────── */}
        {tab === 'results' && !loading && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {constituencies.length === 0 ? (
              <EmptyState icon={BarChart2} text="No results found. Data will be synced overnight." />
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 px-1">
                  {constituencies.length} constituencies · {results.filter(r => r.is_winner).length} winners
                </div>
                {constituencies.map(([cId, cResults]) => {
                  const winner = cResults.find(r => r.is_winner);
                  const maxVotes = Math.max(...cResults.map(r => r.votes ?? 0));
                  const col = partyColor(winner?.party_short || winner?.party || '');
                  const expanded = expandedConstituency === cId;

                  return (
                    <div key={cId} className="rounded-xl border border-white/6 overflow-hidden">
                      {/* Constituency header */}
                      <button
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/4 transition-colors"
                        onClick={() => setExpandedConstituency(expanded ? null : cId)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-sm font-medium text-white truncate">
                            {winner?.constituency_name ?? cId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {winner && (
                            <>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: col + '20', color: col, border: `1px solid ${col}30` }}>
                                {winner.party_short || winner.party}
                              </span>
                              <span className="text-xs text-white/70 truncate max-w-[100px]">
                                {winner.candidate_name.split(' ')[0]}
                              </span>
                            </>
                          )}
                          {winner?.turnout_percent ? (
                            <span className="text-[10px] text-slate-500">
                              <Percent className="w-2.5 h-2.5 inline mr-0.5" />{winner.turnout_percent.toFixed(0)}
                            </span>
                          ) : null}
                          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                        </div>
                      </button>

                      {/* Expanded candidate list */}
                      {expanded && (
                        <div className="px-2 pb-2 border-t border-white/6 space-y-0.5 pt-1">
                          {cResults
                            .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
                            .slice(0, 6)
                            .map(r => (
                              <VoteBar key={r.id} candidate={r} maxVotes={maxVotes} partyCol={partyColor(r.party_short || r.party)} />
                            ))}
                          {winner && (winner.total_electors ?? 0) > 0 && (
                            <div className="flex gap-3 px-2 pt-1.5 text-[10px] text-slate-500">
                              <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{winner.total_electors?.toLocaleString()} electors</span>
                              <span><Percent className="w-2.5 h-2.5 inline mr-0.5" />{winner.turnout_percent?.toFixed(1)}% turnout</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TRENDS TAB ──────────────────────────────────────── */}
        {tab === 'trends' && !loading && (
          <motion.div key="trends" className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Turnout sparkline */}
            {turnout.length >= 2 && (
              <div className="p-4 rounded-2xl bg-white/4 border border-white/8">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Voter Turnout History</span>
                </div>
                <TurnoutSparkline data={turnout} />
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>Peak: {Math.max(...turnout.map(t => t.turnout_percent)).toFixed(1)}%</span>
                  <span>Low: {Math.min(...turnout.map(t => t.turnout_percent)).toFixed(1)}%</span>
                  <span>{turnout.length} elections</span>
                </div>
              </div>
            )}

            {/* Party performance cards */}
            {partyTrends.length > 0 ? (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Party Performance</div>
                <div className="space-y-2">
                  {partyTrends
                    .sort((a, b) => (b.seats_won ?? 0) - (a.seats_won ?? 0))
                    .slice(0, 8)
                    .map((p, i) => {
                      const col = partyColor(p.party_short || p.party);
                      const totalSeats = p.election_cycles?.total_seats ?? 200;
                      const pct = totalSeats > 0 ? ((p.seats_won ?? 0) / totalSeats) * 100 : 0;
                      const change = p.seats_change;

                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/6">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: col + '20', color: col, border: `1px solid ${col}30` }}>
                            {(p.party_short || p.party).slice(0, 3)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-white">{p.party}</span>
                              <span className="text-xs font-bold" style={{ color: col }}>
                                {p.seats_won ?? 0} seats
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                              <motion.div className="h-full rounded-full"
                                style={{ backgroundColor: col }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(pct, 100)}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 }} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500">{p.vote_share?.toFixed(1)}% vote share</span>
                              {change !== undefined && change !== null && (
                                <span className={`text-[10px] flex items-center gap-0.5 ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                  {change > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : change < 0 ? <ArrowDownRight className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                                  {Math.abs(change)}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} text="Trend data loading — check back after sync." />
            )}

            <div className="text-[10px] text-slate-600 flex items-center gap-1.5 px-1">
              <BookOpen className="w-3 h-3" />
              Source: ECI · LokDhaba · India Data Project
            </div>
          </motion.div>
        )}

        {/* ── AFFIDAVITS TAB ───────────────────────────────────── */}
        {tab === 'affidavits' && !loading && (
          <motion.div key="affidavits" className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            <div className="text-xs text-slate-500 px-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Data from ADR/MyNeta candidate affidavits (self-declared)
            </div>

            {candidates.length === 0 ? (
              <EmptyState icon={Scale} text="Affidavit data loading. Source: ADR/MyNeta." />
            ) : (
              candidates.map((c, i) => {
                const col = partyColor(c.party);
                const hasCriminal = (c.criminal_cases ?? 0) > 0;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl bg-white/4 border border-white/8 space-y-3">

                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{c.candidate_name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: col + '20', color: col }}>{c.party}</span>
                          {c.constituency && (
                            <span className="text-[10px] text-slate-500"><MapPin className="w-2 h-2 inline mr-0.5" />{c.constituency}</span>
                          )}
                          {c.age && <span className="text-[10px] text-slate-500"><Calendar className="w-2 h-2 inline mr-0.5" />{c.age}y</span>}
                        </div>
                      </div>
                      {hasCriminal ? (
                        <div className="flex items-center gap-1 text-red-400 text-[10px] shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                          <span>{c.criminal_cases} case{c.criminal_cases !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Clean</span>
                        </div>
                      )}
                    </div>

                    {/* Finance grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-500/8 rounded-xl p-2.5">
                        <p className="text-[10px] text-slate-500 mb-0.5">Total Assets</p>
                        <p className="text-sm font-bold text-emerald-400">{formatCrore(c.total_assets)}</p>
                      </div>
                      <div className="bg-red-500/8 rounded-xl p-2.5">
                        <p className="text-[10px] text-slate-500 mb-0.5">Liabilities</p>
                        <p className="text-sm font-bold text-red-400">{formatCrore(c.total_liabilities)}</p>
                      </div>
                    </div>

                    {c.education && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />{c.education}
                      </div>
                    )}

                    {c.affidavit_url && (
                      <a href={c.affidavit_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                        <ExternalLink className="w-3 h-3" /> View full affidavit (MyNeta)
                      </a>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
      <Icon className="w-6 h-6 opacity-40" />
      <p className="text-sm text-center">{text}</p>
    </div>
  );
}
