'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  User, Clock, MessageSquare, BarChart2,
  Globe, Briefcase, CheckCircle, AlertCircle,
  FileText, Users
} from 'lucide-react';
import { Representative, Constituency } from '@/types';
import { getAttendanceColor, cn } from '@/lib/utils';
import { AIInsightPanel } from './AIInsightPanel';
import { TenureTimeline } from './TenureTimeline';

interface RepresentativeProfileProps {
  constituency: Constituency;
}

// Mock representative lookup
function getMockRepresentative(constituency: Constituency): Representative {
  return {
    id: constituency.id + '-rep',
    name:
      constituency.type === 'parliament'
        ? 'Rajendra Kumar Singh'
        : 'Priya Sharma',
    photo_url: undefined,
    party: constituency.type === 'parliament' ? 'Bharatiya Janata Party' : 'Indian National Congress',
    party_short: constituency.type === 'parliament' ? 'BJP' : 'INC',
    party_color: constituency.type === 'parliament' ? '#FF6B00' : '#19AAED',
    constituency_id: constituency.id,
    constituency_name: constituency.name,
    constituency_type: constituency.type,
    state_id: constituency.state_id,
    state_name: constituency.state_id,
    tenure_start: '2024-06-04',
    is_active: true,
    ministry:
      constituency.type === 'parliament'
        ? [
            {
              id: 'm1',
              representative_id: constituency.id + '-rep',
              portfolio: 'Minister of State for Railways',
              level: 'state',
              from_date: '2024-06-10',
              is_current: true,
            },
          ]
        : [],
    education: 'LLB, University of Delhi',
    age: 52,
    gender: constituency.type === 'parliament' ? 'Male' : 'Female',
    attendance_percentage: 78,
    questions_asked: 34,
    debates_participated: 22,
    bills_introduced: 3,
    criminal_cases: 0,
    assets: '₹2.3 Crore',
    bio: `${constituency.type === 'parliament' ? 'Rajendra Kumar Singh' : 'Priya Sharma'} is a dedicated public servant representing the ${constituency.name} constituency. With years of grassroots work, they have championed causes of local development, healthcare access, and education infrastructure.`,
    twitter: 'https://twitter.com',
    website: 'https://example.com',
  };
}

function StatBadge({ value, label, icon, color }: { value: string | number; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-slate-800/60 border rounded-xl p-3 text-center`} style={{ borderColor: color + '30' }}>
      <div className="flex justify-center mb-1.5" style={{ color }}>
        {icon}
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function RepresentativeProfile({ constituency }: RepresentativeProfileProps) {
  const rep = getMockRepresentative(constituency);
  const [tab, setTab] = useState<'overview' | 'performance' | 'history' | 'ai'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'performance', label: 'Performance', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'history', label: 'History', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'AI Insights', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Header card */}
      <div className="glass-card p-4 relative overflow-hidden">
        {/* Party color stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${rep.party_color}, ${rep.party_color}44)` }}
        />

        <div className="flex items-start gap-3 mt-1">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${rep.party_color}33, ${rep.party_color}11)`,
                border: `2px solid ${rep.party_color}44`,
              }}
            >
              {rep.photo_url ? (
                <Image
                  src={rep.photo_url}
                  alt={rep.name}
                  width={64}
                  height={64}
                  className="rounded-2xl object-cover"
                />
              ) : (
                rep.name.charAt(0)
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-md font-bold text-white"
              style={{ backgroundColor: rep.party_color }}
            >
              {rep.party_short}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-rajdhani)' }}>
              {rep.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium`}
                style={{ backgroundColor: rep.party_color + '22', color: rep.party_color }}
              >
                {rep.constituency_type === 'parliament' ? '🏛 MP' : '🗳 MLA'}
              </span>
              {rep.is_active && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{constituency.name}</p>
          </div>
        </div>

        {/* Ministry badge */}
        {rep.ministry && rep.ministry.length > 0 && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-amber-400">Current Portfolio</div>
                <div className="text-sm text-white mt-0.5">{rep.ministry[0].portfolio}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick social */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
          {rep.twitter && (
            <a href={rep.twitter} target="_blank" rel="noopener" className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-sky-500/20 hover:text-sky-400 transition-all text-xs font-bold">
              𝕏
            </a>
          )}
          {rep.website && (
            <a href={rep.website} target="_blank" rel="noopener" className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-indigo-500/20 hover:text-indigo-400 transition-all">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            Since {new Date(rep.tenure_start).getFullYear()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/60">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all',
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div
            key="overview"
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Bio */}
            {rep.bio && (
              <div className="glass-card p-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{rep.bio}</p>
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
                  <div className="text-xs text-slate-400 mb-1">Declared Assets</div>
                  <div className="text-base font-bold text-green-400">{rep.assets}</div>
                </div>
              )}
              <div className="glass-card p-3">
                <div className="text-xs text-slate-400 mb-1">Criminal Cases</div>
                <div className={`text-base font-bold ${rep.criminal_cases === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {rep.criminal_cases ?? 'N/A'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'performance' && (
          <motion.div
            key="performance"
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Attendance */}
            {rep.attendance_percentage !== undefined && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">Parliament Attendance</h4>
                  <span
                    className="text-lg font-bold"
                    style={{ color: getAttendanceColor(rep.attendance_percentage) }}
                  >
                    {rep.attendance_percentage}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getAttendanceColor(rep.attendance_percentage) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${rep.attendance_percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                  <span>National avg: 79%</span>
                  <span className={rep.attendance_percentage >= 79 ? 'text-green-400' : 'text-red-400'}>
                    {rep.attendance_percentage >= 79 ? '▲ Above avg' : '▼ Below avg'}
                  </span>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <StatBadge
                value={rep.questions_asked ?? 0}
                label="Questions"
                icon={<MessageSquare className="w-4 h-4" />}
                color="#818cf8"
              />
              <StatBadge
                value={rep.debates_participated ?? 0}
                label="Debates"
                icon={<Users className="w-4 h-4" />}
                color="#34d399"
              />
              <StatBadge
                value={rep.bills_introduced ?? 0}
                label="Bills"
                icon={<FileText className="w-4 h-4" />}
                color="#fb923c"
              />
            </div>

            <div className="glass-card p-3 text-xs text-slate-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              Data sourced from Lok Sabha / Vidhan Sabha official records. Connect Supabase to load live data.
            </div>
          </motion.div>
        )}

        {tab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <TenureTimeline representative={rep} />
          </motion.div>
        )}

        {tab === 'ai' && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <AIInsightPanel representative={rep} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
