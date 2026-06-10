'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ExternalLink, Star, Zap, Award, BookOpen, TrendingUp,
  Calendar, MapPin, Quote, User, RefreshCw, ChevronDown, ChevronUp, Newspaper,
  ShieldCheck, Sparkles, Target, Globe
} from 'lucide-react';
import Image from 'next/image';

interface CareerEntry { year: string; event: string; significance: string; }
interface Achievement { title: string; description: string; year?: string; }
interface NewsItem { title: string; url: string; snippet: string; published_at: string; }

interface PoliticianProfile {
  slug: string;
  name: string;
  role: string;
  party: string;
  state_id: string;
  photo_url?: string;
  enhanced_photo_url?: string;
  wikipedia_extract?: string;
  wikipedia_url?: string;
  birth_date?: string;
  birth_place?: string;
  career_timeline: CareerEntry[];
  key_achievements: Achievement[];
  personality_analysis: {
    leadership_style?: string;
    known_for?: string[];
    quote?: string;
    traits?: string[];
    governance_focus?: string;
    political_journey_summary?: string;
  };
  recent_news: NewsItem[];
}

interface Props {
  name: string;
  stateId: string;
  role?: string;
  party?: string;
  partyColor?: string;
  onClose: () => void;
}

const TRAIT_COLORS = [
  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
];

export function PoliticianJourney({ name, stateId, role = 'Chief Minister', party = '', partyColor = '#6366f1', onClose }: Props) {
  const [profile, setProfile] = useState<PoliticianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullBio, setShowFullBio] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeSection, setActiveSection] = useState<'journey' | 'achievements' | 'news'>('journey');

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError('');
    setProfile(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const url = `/api/politician?name=${encodeURIComponent(name)}&stateId=${encodeURIComponent(stateId)}&role=${encodeURIComponent(role)}&party=${encodeURIComponent(party)}`;

    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.profile) setProfile(d.profile);
        else setError('Could not load profile');
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError('Failed to load profile'); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [name, stateId, role, party]);

  const refresh = () => {
    setLoading(true);
    setProfile(null);
    const url = `/api/politician?name=${encodeURIComponent(name)}&stateId=${encodeURIComponent(stateId)}&role=${encodeURIComponent(role)}&party=${encodeURIComponent(party)}&force=1`;
    fetch(url).then(r => r.json()).then(d => {
      if (d.profile) setProfile(d.profile);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Panel */}
        <motion.div
          className="relative w-full sm:max-w-2xl max-h-[95vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-slate-950 border border-white/10 shadow-2xl flex flex-col"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Tricolor bar */}
          <div className="flex h-1 shrink-0">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-white">Political Profile</span>
              <span className="text-xs text-slate-500">· AI-powered · Wikipedia sourced</span>
            </div>
            <div className="flex items-center gap-2">
              {!loading && (
                <button onClick={refresh} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-500 hover:text-slate-300 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                  <Sparkles className="w-5 h-5 text-violet-400 absolute inset-0 m-auto" />
                </div>
                <div className="text-center">
                  <p className="text-white/60 text-sm">Building profile for {name}</p>
                  <p className="text-white/30 text-xs mt-1">Wikipedia · Web · Claude AI</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-slate-400 text-sm">{error}</p>
                <button onClick={refresh} className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm hover:bg-violet-500/30 transition-colors">
                  Try again
                </button>
              </div>
            )}

            {profile && !loading && (
              <div>
                {/* ── HERO ────────────────────────────────── */}
                <div className="relative px-5 pt-6 pb-5 overflow-hidden">
                  {/* Dynamic party glow */}
                  <div
                    className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
                    style={{ background: partyColor }}
                  />

                  <div className="flex gap-4 items-start relative">
                    {/* Photo or initials */}
                    <div className="shrink-0 relative">
                      {(profile.enhanced_photo_url || profile.photo_url) && !imgError ? (
                        <div
                          className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl relative"
                          style={{
                            borderWidth: 2,
                            borderStyle: 'solid',
                            borderColor: partyColor,
                            outline: `3px solid ${partyColor}30`,
                            outlineOffset: '3px',
                            boxShadow: `0 8px 32px ${partyColor}30, 0 2px 8px rgba(0,0,0,0.6)`,
                          }}
                        >
                          <Image
                            src={profile.enhanced_photo_url || profile.photo_url!}
                            alt={profile.name}
                            width={80}
                            height={80}
                            className="object-cover object-top w-full h-full"
                            style={{
                              // Professional CSS enhancement: slight contrast boost, natural saturation
                              filter: 'contrast(1.06) brightness(1.03) saturate(1.12)',
                            }}
                            onError={() => setImgError(true)}
                            unoptimized
                          />
                          {/* Subtle bottom gradient for depth */}
                          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                        </div>
                      ) : (
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 shadow-xl"
                          style={{ background: partyColor + '22', borderColor: partyColor, color: partyColor }}
                        >
                          {initials}
                        </div>
                      )}
                      {/* Enhanced badge — shows when AI-enhanced photo is used */}
                      {profile.enhanced_photo_url && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-violet-500 border-2 border-slate-950 flex items-center justify-center" title="AI-enhanced photo">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      {/* Verified badge */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                        <ShieldCheck className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-white leading-tight">{profile.name}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{ background: partyColor + '22', color: partyColor, border: `1px solid ${partyColor}44` }}
                        >
                          {profile.party || party}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {profile.role}
                        </span>
                        {profile.birth_date && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            b. {profile.birth_date}
                          </span>
                        )}
                      </div>

                      {/* Governance focus chip */}
                      {profile.personality_analysis?.governance_focus && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <Target className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-300/80 leading-relaxed">
                            {profile.personality_analysis.governance_focus}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personality traits */}
                  {profile.personality_analysis?.traits && profile.personality_analysis.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {profile.personality_analysis.traits.map((trait, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${TRAIT_COLORS[i % TRAIT_COLORS.length]}`}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Known for */}
                  {profile.personality_analysis?.known_for && profile.personality_analysis.known_for.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {profile.personality_analysis.known_for.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-start gap-2 bg-white/4 rounded-xl px-3 py-2">
                          <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                          <span className="text-xs text-white/70 leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── BIO ─────────────────────────────────── */}
                {(profile.wikipedia_extract || profile.personality_analysis?.political_journey_summary) && (
                  <div className="mx-5 mb-4 p-4 rounded-2xl bg-white/4 border border-white/8">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Biography</span>
                      {profile.wikipedia_url && (
                        <a href={profile.wikipedia_url} target="_blank" rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                          Wikipedia <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <p className={`text-sm text-white/70 leading-relaxed ${!showFullBio ? 'line-clamp-3' : ''}`}>
                      {profile.wikipedia_extract || profile.personality_analysis?.political_journey_summary}
                    </p>
                    {(profile.wikipedia_extract?.length ?? 0) > 200 && (
                      <button
                        onClick={() => setShowFullBio(!showFullBio)}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {showFullBio ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
                      </button>
                    )}
                  </div>
                )}

                {/* ── LEADERSHIP STYLE ────────────────────── */}
                {profile.personality_analysis?.leadership_style && (
                  <div className="mx-5 mb-4 p-4 rounded-2xl bg-violet-500/8 border border-violet-500/15">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Leadership Style</span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{profile.personality_analysis.leadership_style}</p>
                  </div>
                )}

                {/* ── QUOTE ───────────────────────────────── */}
                {profile.personality_analysis?.quote && (
                  <div className="mx-5 mb-4 px-4 py-3 border-l-2 border-amber-400/60 bg-amber-500/5 rounded-r-xl">
                    <Quote className="w-4 h-4 text-amber-400/60 mb-1" />
                    <p className="text-sm text-amber-100/80 italic leading-relaxed">
                      {profile.personality_analysis.quote}
                    </p>
                    <p className="text-xs text-amber-400/60 mt-1.5">— {profile.name}</p>
                  </div>
                )}

                {/* ── SECTION TABS ─────────────────────────── */}
                <div className="sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10 px-5 py-2 border-b border-white/6">
                  <div className="flex gap-1">
                    {([
                      { id: 'journey', icon: Calendar, label: 'Timeline' },
                      { id: 'achievements', icon: Award, label: 'Achievements' },
                      { id: 'news', icon: Newspaper, label: 'News' },
                    ] as const).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeSection === tab.id
                            ? 'bg-white/10 text-white'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <tab.icon className="w-3 h-3" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── CAREER TIMELINE ─────────────────────── */}
                {activeSection === 'journey' && (
                  <div className="px-5 py-4">
                    {profile.career_timeline && profile.career_timeline.length > 0 ? (
                      <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gradient-to-b from-violet-500/60 via-blue-500/40 to-emerald-500/30" />

                        <div className="space-y-5">
                          {profile.career_timeline.map((entry, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              className="flex gap-4 items-start"
                            >
                              {/* Node */}
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 relative z-10"
                                style={{
                                  background: `hsl(${240 - i * 25}, 70%, 15%)`,
                                  borderColor: `hsl(${240 - i * 25}, 70%, 50%)`,
                                  color: `hsl(${240 - i * 25}, 70%, 70%)`,
                                }}
                              >
                                {entry.year?.slice(-2) || i + 1}
                              </div>

                              <div className="flex-1 pb-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-slate-400">{entry.year}</span>
                                </div>
                                <p className="text-sm font-medium text-white leading-snug">{entry.event}</p>
                                {entry.significance && (
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{entry.significance}</p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        Timeline data not available for this politician
                      </div>
                    )}
                  </div>
                )}

                {/* ── ACHIEVEMENTS ────────────────────────── */}
                {activeSection === 'achievements' && (
                  <div className="px-5 py-4 space-y-3">
                    {profile.key_achievements && profile.key_achievements.length > 0 ? (
                      profile.key_achievements.map((ach, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="p-4 rounded-2xl bg-white/4 border border-white/8 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                              <TrendingUp className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-white">{ach.title}</p>
                                {ach.year && <span className="text-xs text-slate-500">{ach.year}</span>}
                              </div>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ach.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        Achievements data being compiled
                      </div>
                    )}
                  </div>
                )}

                {/* ── RECENT NEWS ──────────────────────────── */}
                {activeSection === 'news' && (
                  <div className="px-5 py-4 space-y-3">
                    {profile.recent_news && profile.recent_news.length > 0 ? (
                      profile.recent_news.map((item, i) => (
                        <motion.a
                          key={i}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex gap-3 p-3 rounded-xl bg-white/4 border border-white/8 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Newspaper className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors leading-snug line-clamp-2">{item.title}</p>
                            {item.snippet && (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{item.snippet}</p>
                            )}
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                        </motion.a>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No recent news found
                      </div>
                    )}
                  </div>
                )}

                {/* ── FOOTER ──────────────────────────────── */}
                <div className="px-5 py-4 border-t border-white/6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <BookOpen className="w-3 h-3" />
                    <span>Wikipedia · Tavily · Claude AI</span>
                  </div>
                  {profile.wikipedia_url && (
                    <a
                      href={profile.wikipedia_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Full Wikipedia page <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
