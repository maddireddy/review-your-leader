'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Clock, MessageSquare, BarChart2,
  Globe, Briefcase, CheckCircle, AlertCircle,
  FileText, Users, TrendingUp, Award, Scale,
  ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { Constituency, Representative } from '@/types';
import { cn } from '@/lib/utils';
import { getPartyTheme, getAttendanceTheme, CONSTITUENCY_COLORS } from '@/lib/colorSystem';
import { AIInsightPanel } from './AIInsightPanel';
import { TenureTimeline } from './TenureTimeline';
import { RepPhoto } from '@/components/UI/RepPhoto';
import { CitizenRating } from '@/components/Civic/CitizenRating';
import { IssueTracker } from '@/components/Civic/IssueTracker';
import { NewsFeed } from '@/components/Civic/NewsFeed';
import {
  getRepsByConstituency,
  getRepsByState,
  RepresentativeData,
} from '@/lib/representativesData';

interface RepresentativeProfileProps {
  constituency: Constituency;
}

// ─── Best-effort real data lookup ───────────────────────────────
function findRepresentative(constituency: Constituency): RepresentativeData {
  // 1. Exact constituency match
  const exact = getRepsByConstituency(constituency.id);
  if (exact.length > 0) return exact[0];

  // 2. Name-based fuzzy match
  const stateReps = getRepsByState(constituency.state_id);
  const nameMatch = stateReps.find(r =>
    r.constituency_name.toLowerCase().includes(constituency.name.toLowerCase().split(' ')[0]) ||
    constituency.name.toLowerCase().includes(r.constituency_name.toLowerCase().split(' ')[0])
  );
  if (nameMatch) return nameMatch;

  // 3. First MP from that state of matching type (best fallback)
  const typeMatch = stateReps.find(r => r.constituency_type === constituency.type);
  if (typeMatch) return typeMatch;

  // 4. Absolute fallback — synthesised
  return {
    id: constituency.id + '-rep',
    name: constituency.type === 'parliament' ? 'Representative (Data Loading)' : 'MLA (Data Loading)',
    party: 'Independent',
    party_short: 'IND',
    constituency_id: constituency.id,
    constituency_name: constituency.name,
    constituency_type: constituency.type,
    state_id: constituency.state_id,
    state_name: constituency.state_id,
    tenure_start: '2024-06-04',
    is_active: true,
    gender: 'Male',
    criminal_cases: 0,
    attendance_percentage: 75,
    questions_asked: 20,
    debates_participated: 12,
    bills_introduced: 1,
    bio: `Representing ${constituency.name}. Full profile data will be available once connected to the Election Commission database.`,
  };
}

function StatBadge({ value, label, icon, color }: {
  value: string | number; label: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-slate-800/60 border rounded-xl p-3 text-center" style={{ borderColor: color + '30' }}>
      <div className="flex justify-center mb-1.5" style={{ color }}>{icon}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function RepresentativeProfile({ constituency }: RepresentativeProfileProps) {
  const rep = findRepresentative(constituency);
  const theme = getPartyTheme(rep.party_short || rep.party);
  const [tab, setTab] = useState<'overview' | 'performance' | 'election' | 'history' | 'ai'>('overview');
  const [showFullBio, setShowFullBio] = useState(false);
  const constColors = constituency.type === 'parliament' ? CONSTITUENCY_COLORS.parliament : CONSTITUENCY_COLORS.assembly;

  const tabs = [
    { id: 'overview',     label: 'Profile',      icon: <User className="w-3.5 h-3.5" /> },
    { id: 'performance',  label: 'Stats',         icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'election',     label: 'Election',      icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'history',      label: 'History',       icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'ai',           label: 'AI',            icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ] as const;

  const latestElection = rep.election_results?.[rep.election_results.length - 1];

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* ── Hero Card ─────────────────────────────────────────── */}
      <div className="glass-card relative overflow-hidden">
        {/* Party gradient stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: theme.gradient }} />

        <div className="p-4 pt-5">
          <div className="flex items-start gap-3">
            {/* Wikipedia photo */}
            <RepPhoto
              name={rep.name}
              party_short={rep.party_short}
              wikipedia_slug={rep.wikipedia_slug}
              size={64}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                {rep.name}
              </h2>
              {rep.name_native && (
                <div className="text-xs text-slate-400 mt-0.5">{rep.name_native}</div>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: constColors.light, color: constColors.primary, border: `1px solid ${constColors.border}` }}
                >
                  {rep.constituency_type === 'parliament' ? '🏛 MP' : '🗳 MLA'}
                </span>
                {rep.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                )}
                {rep.gender === 'Female' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400">♀</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{constituency.name}</p>
            </div>
          </div>

          {/* Ministry portfolio */}
          {rep.ministry && rep.ministry.filter(m => m.is_current).length > 0 && (
            <motion.div
              className="mt-3 p-2.5 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-amber-400">Union Minister</div>
                  <div className="text-sm text-white mt-0.5">{rep.ministry.find(m => m.is_current)?.portfolio}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick stats strip */}
          <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-700/40">
            {[
              { label: 'Attendance', value: `${rep.attendance_percentage ?? '--'}%`, color: rep.attendance_percentage ? getAttendanceTheme(rep.attendance_percentage).color : '#6B7280' },
              { label: 'Questions', value: rep.questions_asked ?? '--', color: '#818cf8' },
              { label: 'Debates', value: rep.debates_participated ?? '--', color: '#34d399' },
              { label: 'Bills', value: rep.bills_introduced ?? '--', color: '#fb923c' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-sm font-bold" style={{ color: s.color }}>{String(s.value)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Social links */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-700/40">
            {rep.twitter && (
              <a href={rep.twitter} target="_blank" rel="noopener"
                className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-sky-500/20 hover:text-sky-400 transition-all text-xs font-bold text-slate-400">
                𝕏
              </a>
            )}
            {rep.website && (
              <a href={rep.website} target="_blank" rel="noopener"
                className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-indigo-500/20 hover:text-indigo-400 transition-all text-slate-400">
                <Globe className="w-3.5 h-3.5" />
              </a>
            )}
            <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              Since {new Date(rep.tenure_start).getFullYear()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/60 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              tab === t.id ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
            style={tab === t.id ? { background: theme.gradient, boxShadow: theme.glow } : {}}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <motion.div key="overview" className="space-y-3"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>

            {/* Bio */}
            {rep.bio && (
              <div className="glass-card p-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About</h4>
                <p className={cn('text-sm text-slate-300 leading-relaxed', !showFullBio && 'line-clamp-3')}>
                  {rep.bio}
                </p>
                {rep.bio.length > 160 && (
                  <button onClick={() => setShowFullBio(!showFullBio)}
                    className="flex items-center gap-1 text-xs text-indigo-400 mt-1.5 hover:text-indigo-300">
                    {showFullBio ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Read more</>}
                  </button>
                )}
              </div>
            )}

            {/* Quick facts */}
            <div className="grid grid-cols-2 gap-2">
              {rep.age && (
                <div className="glass-card p-3">
                  <div className="text-xs text-slate-400 mb-1">Age</div>
                  <div className="text-base font-bold text-white">{rep.age} yrs</div>
                </div>
              )}
              {rep.education && (
                <div className="glass-card p-3">
                  <div className="text-xs text-slate-400 mb-1">Education</div>
                  <div className="text-xs font-medium text-white leading-tight">{rep.education}</div>
                </div>
              )}
              {rep.assets && (
                <div className="glass-card p-3">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Declared Assets
                  </div>
                  <div className="text-sm font-bold text-green-400">{rep.assets}</div>
                  {rep.assets_prev && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Prev: {rep.assets_prev}
                    </div>
                  )}
                </div>
              )}
              <div className="glass-card p-3">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Criminal Cases
                </div>
                <div className={cn('text-base font-bold', rep.criminal_cases === 0 ? 'text-green-400' : 'text-red-400')}>
                  {rep.criminal_cases ?? 'N/A'}
                  {rep.criminal_cases > 0 && <span className="text-xs font-normal text-slate-500 ml-1">declared</span>}
                </div>
              </div>
            </div>

            {/* Citizen Ratings */}
            <CitizenRating repId={rep.id} partyShort={rep.party_short} repName={rep.name} />

            {/* Issue Tracker */}
            <IssueTracker
              constituencyId={rep.constituency_id}
              stateId={rep.state_id}
              constituencyName={rep.constituency_name}
            />

            {/* News Feed */}
            <NewsFeed entityName={rep.name} entityType="representative" />

            {/* Wikipedia link */}
            {rep.wikipedia_slug && (
              <a
                href={`https://en.wikipedia.org/wiki/${rep.wikipedia_slug}`}
                target="_blank"
                rel="noopener"
                className="glass-card p-3 flex items-center gap-2 hover:border-indigo-500/40 transition-all group text-sm text-slate-400 hover:text-slate-200"
              >
                <div className="w-6 h-6 rounded-md bg-slate-700/60 flex items-center justify-center text-xs">W</div>
                View Wikipedia profile
                <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-600 group-hover:text-indigo-400" />
              </a>
            )}
          </motion.div>
        )}

        {/* PERFORMANCE */}
        {tab === 'performance' && (
          <motion.div key="performance" className="space-y-3"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>

            {rep.attendance_percentage !== undefined && (() => {
              const att = getAttendanceTheme(rep.attendance_percentage);
              return (
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Parliament Attendance</h4>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{ background: att.bg, color: att.color }}>
                        {att.label}
                      </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: att.color }}>
                      {rep.attendance_percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: att.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${rep.attendance_percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                    <span>National avg: 79%</span>
                    <span style={{ color: rep.attendance_percentage >= 79 ? '#22C55E' : '#EF4444' }}>
                      {rep.attendance_percentage >= 79 ? '▲ Above avg' : '▼ Below avg'}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-3 gap-2">
              <StatBadge value={rep.questions_asked ?? 0} label="Questions" icon={<MessageSquare className="w-4 h-4" />} color="#818cf8" />
              <StatBadge value={rep.debates_participated ?? 0} label="Debates" icon={<Users className="w-4 h-4" />} color="#34d399" />
              <StatBadge value={rep.bills_introduced ?? 0} label="Bills" icon={<FileText className="w-4 h-4" />} color="#fb923c" />
            </div>

            {rep.ministry && rep.ministry.length > 0 && (
              <div className="glass-card p-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Ministry Portfolios
                </h4>
                <div className="space-y-2">
                  {rep.ministry.map((m, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', m.is_current ? 'bg-green-400' : 'bg-slate-500')} />
                      <div>
                        <div className="text-sm text-white font-medium">{m.portfolio}</div>
                        <div className="text-xs text-slate-500">
                          {m.level} · Since {m.from_date?.slice(0, 4)}
                          {m.is_current && <span className="ml-1 text-green-400">· Active</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card p-3 text-xs text-slate-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              Data from Lok Sabha / PRS India / Election Commission of India official records.
            </div>
          </motion.div>
        )}

        {/* ELECTION RESULTS */}
        {tab === 'election' && (
          <motion.div key="election" className="space-y-3"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>

            {latestElection ? (
              <>
                {/* Win margin hero */}
                <div className="glass-card p-4 overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: theme.gradient }} />
                  <div className="text-xs text-slate-500 mb-1 mt-1">2024 General Election · {constituency.name}</div>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-2xl font-bold" style={{ color: theme.text }}>
                        {latestElection.vote_share.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-400">Vote share</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        +{latestElection.margin.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">Winning margin</div>
                    </div>
                  </div>

                  {/* Vote bar */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: theme.text }}>{rep.name}</span>
                        <span className="text-slate-300">{latestElection.votes.toLocaleString()} votes</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: theme.gradient }}
                          initial={{ width: 0 }} animate={{ width: `${latestElection.vote_share}%` }}
                          transition={{ duration: 1, delay: 0.1 }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{latestElection.runner_up} ({latestElection.runner_up_party})</span>
                        <span className="text-slate-500">{(latestElection.votes - latestElection.margin).toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-slate-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${((latestElection.votes - latestElection.margin) / latestElection.total_voters * 100).toFixed(1)}%` }}
                          transition={{ duration: 1, delay: 0.2 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Turnout + voters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="glass-card p-3 text-center">
                    <div className="text-xs text-slate-400 mb-1">Voter Turnout</div>
                    <div className="text-xl font-bold" style={{ color: theme.text }}>
                      {latestElection.turnout.toFixed(1)}%
                    </div>
                  </div>
                  <div className="glass-card p-3 text-center">
                    <div className="text-xs text-slate-400 mb-1">Total Voters</div>
                    <div className="text-xl font-bold text-white">
                      {(latestElection.total_voters / 100000).toFixed(1)}L
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card p-6 text-center text-slate-400 text-sm">
                Election data will be available after connecting to the ECI database.
              </div>
            )}
          </motion.div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <motion.div key="history"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TenureTimeline representative={{
              ...rep,
              id: rep.id,
              photo_url: undefined,
              party_color: theme.primary,
              constituency_id: rep.constituency_id,
              constituency_name: rep.constituency_name,
              constituency_type: rep.constituency_type,
              state_name: rep.state_name,
            } as Representative} />
          </motion.div>
        )}

        {/* AI CHAT */}
        {tab === 'ai' && (
          <motion.div key="ai"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AIInsightPanel representative={{
              ...rep,
              id: rep.id,
              photo_url: undefined,
              party_color: theme.primary,
              constituency_id: rep.constituency_id,
              constituency_name: rep.constituency_name,
              constituency_type: rep.constituency_type,
              state_name: rep.state_name,
            } as Representative} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
