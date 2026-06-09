'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { ArrowLeft, Award, Users, MapPin, FileText } from 'lucide-react';
import { getPartyScorecards } from '@/lib/partyStats';

export default function PartyDashboard() {
  const cards = useMemo(() => getPartyScorecards(), []);

  const mpData = cards.map(c => ({ name: c.party_short, value: c.mp_count, color: c.color }));
  const attendanceData = cards
    .filter(c => c.mp_count >= 1)
    .map(c => ({ name: c.party_short, value: c.avg_attendance, color: c.color }))
    .sort((a, b) => b.value - a.value);

  // Top 3 parties for radar
  const top3 = cards.slice(0, 3);
  const radarMetrics = ['Attendance', 'Questions', 'Bills', 'Debates', 'Clean'];
  const radarData = radarMetrics.map(metric => {
    const row: Record<string, string | number> = { metric };
    top3.forEach(c => {
      let v = 0;
      if (metric === 'Attendance') v = c.avg_attendance;
      else if (metric === 'Questions') v = Math.min(100, c.total_questions);
      else if (metric === 'Bills') v = Math.min(100, c.total_bills * 8);
      else if (metric === 'Debates') v = Math.min(100, c.total_debates);
      else if (metric === 'Clean') v = Math.max(0, 100 - c.avg_criminal_cases * 30);
      row[c.party_short] = v;
    });
    return row;
  });

  return (
    <main className="animated-gradient min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to map
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
              Party Performance Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Aggregate scorecards across parties · Based on 2024 Lok Sabha data
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Parties Tracked', value: cards.length, icon: <Users className="w-4 h-4" />, color: '#818cf8' },
              { label: 'Total MPs', value: cards.reduce((s, c) => s + c.mp_count, 0), icon: <MapPin className="w-4 h-4" />, color: '#34d399' },
              { label: 'Union Ministers', value: cards.reduce((s, c) => s + c.ministers, 0), icon: <Award className="w-4 h-4" />, color: '#fbbf24' },
              { label: 'Bills Introduced', value: cards.reduce((s, c) => s + c.total_bills, 0), icon: <FileText className="w-4 h-4" />, color: '#fb923c' },
            ].map(s => (
              <div key={s.label} className="glass-card p-3 text-center">
                <div className="flex justify-center mb-1.5" style={{ color: s.color }}>{s.icon}</div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* MP count bar chart */}
          <div className="glass-card p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">MPs by Party (sample data)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mpData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {mpData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance bar chart */}
          <div className="glass-card p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Average Attendance by Party</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} width={50} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {attendanceData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar — top 3 parties */}
          {top3.length >= 2 && (
            <div className="glass-card p-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-1">Top 3 Parties — Multi-metric Profile</h3>
              <p className="text-xs text-slate-500 mb-3">Normalised 0–100 across 5 performance dimensions</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  {top3.map(c => (
                    <Radar key={c.party_short} name={c.party_short} dataKey={c.party_short}
                      stroke={c.color} fill={c.color} fillOpacity={0.25} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {top3.map(c => (
                  <div key={c.party_short} className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm" style={{ background: c.color }} />
                    <span className="text-slate-400">{c.party_short}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scorecard table */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Full Scorecard</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700/50">
                    <th className="text-left py-2 px-2">Party</th>
                    <th className="text-center py-2 px-2">MPs</th>
                    <th className="text-center py-2 px-2">States</th>
                    <th className="text-center py-2 px-2">Att%</th>
                    <th className="text-center py-2 px-2">Ques</th>
                    <th className="text-center py-2 px-2">Bills</th>
                    <th className="text-center py-2 px-2">Min.</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(c => (
                    <tr key={c.party_short} className="border-b border-slate-800/40">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
                          <span className="text-white font-medium">{c.party_short}</span>
                        </div>
                      </td>
                      <td className="text-center text-slate-300">{c.mp_count}</td>
                      <td className="text-center text-slate-300">{c.states_governed}</td>
                      <td className="text-center text-slate-300">{c.avg_attendance}%</td>
                      <td className="text-center text-slate-300">{c.total_questions}</td>
                      <td className="text-center text-slate-300">{c.total_bills}</td>
                      <td className="text-center text-amber-400">{c.ministers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 text-center mt-4">
            Aggregates computed from sampled representative data. Connect full ECI dataset for complete coverage.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
