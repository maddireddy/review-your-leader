'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Scale, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { getRepById, RepresentativeData } from '@/lib/representativesData';
import { getPartyTheme, getAttendanceTheme } from '@/lib/colorSystem';
import { RepPhoto } from '@/components/UI/RepPhoto';

interface ComparePageProps {
  params: Promise<{ id1: string; id2: string }>;
}


function MetricRow({ label, icon, aWins, bWins, aDisplay, bDisplay }: {
  label: string; icon: React.ReactNode;
  a?: number; b?: number; aWins: boolean; bWins: boolean;
  aDisplay: string; bDisplay: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center py-3 border-b border-slate-800/50">
      <div className={`text-right text-sm font-bold ${aWins ? 'text-green-400' : 'text-slate-300'}`}>
        {aDisplay}
        {aWins && <Trophy className="w-3 h-3 inline ml-1 text-green-400" />}
      </div>
      <div className="flex flex-col items-center text-slate-500 min-w-[90px]">
        {icon}
        <span className="text-[10px] uppercase tracking-wide mt-0.5">{label}</span>
      </div>
      <div className={`text-left text-sm font-bold ${bWins ? 'text-green-400' : 'text-slate-300'}`}>
        {bWins && <Trophy className="w-3 h-3 inline mr-1 text-green-400" />}
        {bDisplay}
      </div>
    </div>
  );
}

function RepHeader({ rep }: { rep: RepresentativeData }) {
  const theme = getPartyTheme(rep.party_short);
  return (
    <div className={`flex flex-col items-center text-center gap-2`}>
      <RepPhoto name={rep.name} party_short={rep.party_short} wikipedia_slug={rep.wikipedia_slug} size={72} />
      <div>
        <h2 className="text-base font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-rajdhani)' }}>
          {rep.name}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-bold mt-1 inline-block"
          style={{ background: theme.badge, color: theme.text }}
        >
          {rep.party_short}
        </span>
        <p className="text-xs text-slate-500 mt-1">{rep.constituency_name}</p>
        <p className="text-[10px] text-slate-600">{rep.state_name}</p>
      </div>
    </div>
  );
}

export default function ComparePage({ params }: ComparePageProps) {
  const { id1, id2 } = use(params);
  const a = getRepById(id1);
  const b = getRepById(id2);

  if (!a || !b) {
    return (
      <main className="animated-gradient min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-white mb-2">Representative not found</h1>
          <p className="text-sm text-slate-400 mb-4">
            One or both representatives could not be located.
          </p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to map</Link>
        </div>
      </main>
    );
  }

  const aAtt = a.attendance_percentage ?? 0;
  const bAtt = b.attendance_percentage ?? 0;
  const aMargin = a.election_results?.[a.election_results.length - 1]?.margin ?? 0;
  const bMargin = b.election_results?.[b.election_results.length - 1]?.margin ?? 0;

  return (
    <main className="animated-gradient min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to map
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
              Head-to-Head Comparison
            </h1>
            <p className="text-sm text-slate-400 mt-1">Side-by-side representative scorecard</p>
          </div>

          {/* Headers */}
          <div className="glass-card p-5 mb-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4">
              <RepHeader rep={a} />
              <div className="text-2xl font-bold text-slate-600">VS</div>
              <RepHeader rep={b} />
            </div>
          </div>

          {/* Metrics */}
          <div className="glass-card p-5">
            <MetricRow
              label="Attendance" icon={<Calendar className="w-4 h-4" />}
              a={aAtt} b={bAtt}
              aWins={aAtt > bAtt} bWins={bAtt > aAtt}
              aDisplay={`${aAtt}%`} bDisplay={`${bAtt}%`}
            />
            <MetricRow
              label="Questions" icon={<AlertCircle className="w-4 h-4" />}
              a={a.questions_asked ?? 0} b={b.questions_asked ?? 0}
              aWins={(a.questions_asked ?? 0) > (b.questions_asked ?? 0)}
              bWins={(b.questions_asked ?? 0) > (a.questions_asked ?? 0)}
              aDisplay={`${a.questions_asked ?? 0}`} bDisplay={`${b.questions_asked ?? 0}`}
            />
            <MetricRow
              label="Debates" icon={<TrendingUp className="w-4 h-4" />}
              a={a.debates_participated ?? 0} b={b.debates_participated ?? 0}
              aWins={(a.debates_participated ?? 0) > (b.debates_participated ?? 0)}
              bWins={(b.debates_participated ?? 0) > (a.debates_participated ?? 0)}
              aDisplay={`${a.debates_participated ?? 0}`} bDisplay={`${b.debates_participated ?? 0}`}
            />
            <MetricRow
              label="Bills" icon={<Scale className="w-4 h-4" />}
              a={a.bills_introduced ?? 0} b={b.bills_introduced ?? 0}
              aWins={(a.bills_introduced ?? 0) > (b.bills_introduced ?? 0)}
              bWins={(b.bills_introduced ?? 0) > (a.bills_introduced ?? 0)}
              aDisplay={`${a.bills_introduced ?? 0}`} bDisplay={`${b.bills_introduced ?? 0}`}
            />
            <MetricRow
              label="Win Margin" icon={<Trophy className="w-4 h-4" />}
              a={aMargin} b={bMargin}
              aWins={aMargin > bMargin} bWins={bMargin > aMargin}
              aDisplay={aMargin > 0 ? `${(aMargin / 1000).toFixed(0)}K` : 'N/A'}
              bDisplay={bMargin > 0 ? `${(bMargin / 1000).toFixed(0)}K` : 'N/A'}
            />
            <MetricRow
              label="Clean Record" icon={<Scale className="w-4 h-4" />}
              a={5 - (a.criminal_cases ?? 0)} b={5 - (b.criminal_cases ?? 0)}
              aWins={(a.criminal_cases ?? 0) < (b.criminal_cases ?? 0)}
              bWins={(b.criminal_cases ?? 0) < (a.criminal_cases ?? 0)}
              aDisplay={`${a.criminal_cases ?? 0} cases`} bDisplay={`${b.criminal_cases ?? 0} cases`}
            />
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center py-3">
              <div className="text-right text-sm font-bold text-slate-300">{a.assets ?? 'N/A'}</div>
              <div className="flex flex-col items-center text-slate-500 min-w-[90px]">
                <Scale className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wide mt-0.5">Assets</span>
              </div>
              <div className="text-left text-sm font-bold text-slate-300">{b.assets ?? 'N/A'}</div>
            </div>
          </div>

          {/* Attendance ratings */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[a, b].map((rep, i) => {
              const att = getAttendanceTheme(rep.attendance_percentage ?? 0);
              return (
                <div key={i} className="glass-card p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">{rep.name.split(' ').slice(-1)[0]} rating</div>
                  <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: att.bg, color: att.color }}>
                    {att.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Share */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Share this comparison: <span className="text-indigo-400">reviewyourleader.com/compare/{id1}/{id2}</span>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
