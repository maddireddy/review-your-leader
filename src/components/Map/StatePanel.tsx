'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Building2, Sparkles, Loader2, ChevronDown, ChevronUp, Globe, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { StateInfo } from '@/lib/indiaData';
import { getDistrictsByState, DistrictInfo } from '@/lib/districtData';
import { formatNumber } from '@/lib/utils';
import { getPartyTheme, VALIDATION_COLORS } from '@/lib/colorSystem';
import { NewsFeed } from '@/components/Civic/NewsFeed';

interface StatePanelProps {
  state: StateInfo;
  onDistrictSelect: (district: DistrictInfo) => void;
}

export function StatePanel({ state, onDistrictSelect }: StatePanelProps) {
  const districts = getDistrictsByState(state.id);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [validation, setValidation] = useState<{
    status: string; consensusScore: number; modelsUsed: number;
    autoCorrected: boolean; factViolations: number; fromCache: boolean; cacheAge?: number;
  } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // ── Live CM overlay (autonomous pipeline) ─────────────────────
  const [liveCM, setLiveCM] = useState<{
    name: string; party?: string; isLive: boolean; confidence?: number;
    sources?: string[]; verifiedAt?: string;
  } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const theme = getPartyTheme(state.ruling_party);
  const cmName = liveCM?.name || state.chief_minister;
  const cmParty = liveCM?.party || state.cm_party;

  const visibleDistricts = showAll ? districts : districts.slice(0, 8);

  // Reset + load live overlay when state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAiInsight('');
      setLiveCM(null);
    }, 0);
    // Fetch any already-verified live fact (fast, cached)
    fetch(`/api/state-live?stateId=${state.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.is_live && d.chief_minister) {
          setLiveCM({
            name: d.chief_minister, party: d.cm_party, isLive: true,
            confidence: d.confidence, sources: d.sources, verifiedAt: d.verified_at,
          });
        }
      })
      .catch(() => {});
    return () => clearTimeout(timer);
  }, [state.id]);

  // On-demand live verification — triggers the full web-search + validation pipeline
  async function verifyLive() {
    setVerifying(true);
    try {
      const res = await fetch('/api/state-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateId: state.id }),
      });
      const d = await res.json();
      if (d.chief_minister) {
        setLiveCM({
          name: d.chief_minister, party: d.cm_party, isLive: d.is_live,
          confidence: d.confidence, sources: d.sources,
          verifiedAt: new Date().toISOString(),
        });
      }
    } catch { /* ignore */ }
    finally { setVerifying(false); }
  }

  async function fetchAIInsight(forceRefresh = false) {
    setLoadingAI(true);
    setAiInsight('');
    setValidation(null);
    try {
      const res = await fetch('/api/state-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateId: state.id, forceRefresh }),
      });
      const data = await res.json();
      setAiInsight(data.insight || 'Insight unavailable.');
      if (data.validation) setValidation(data.validation);
    } catch {
      setAiInsight('Unable to fetch AI insight. Please configure GROQ_API_KEY in Vercel settings.');
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* State + Landmark Hero Card */}
      <div className="glass-card-elevated overflow-hidden">
        {/* Dynamic party gradient stripe */}
        <div className="h-1.5 w-full" style={{ background: theme.gradient }} />

        <div className="p-4">
          {/* Landmark */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{state.landmark_emoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{state.landmark}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{state.landmark_desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* State stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
              <Building2 className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              <div className="text-base font-bold text-white">{state.districts_count}</div>
              <div className="text-xs text-slate-500">Districts</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
              <Globe className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <div className="text-base font-bold text-white">{state.formed_year}</div>
              <div className="text-xs text-slate-500">Est.</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
              <span className="text-base">{state.is_ut ? '🏙️' : '🗺️'}</span>
              <div className="text-xs font-bold text-white mt-1">{state.is_ut ? 'UT' : 'State'}</div>
              <div className="text-xs text-slate-500">Type</div>
            </div>
          </div>

          {/* Capital */}
          <div className="flex items-center gap-2 mb-3 text-sm">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-slate-400">Capital:</span>
            <span className="text-amber-400 font-semibold">{state.capital}</span>
          </div>
        </div>
      </div>

      {/* Chief Minister Card */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Current {state.is_ut ? 'Lt. Governor / CM' : 'Chief Minister'}
          </span>
          {/* Live verify button */}
          <button
            onClick={verifyLive}
            disabled={verifying}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all disabled:opacity-50"
            style={{
              borderColor: liveCM?.isLive ? 'rgba(34,197,94,0.4)' : 'rgba(148,163,184,0.3)',
              background: liveCM?.isLive ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.05)',
              color: liveCM?.isLive ? '#4ade80' : '#94a3b8',
            }}
            title="Fetch latest via live web search + 3-model validation"
          >
            {verifying
              ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying…</>
              : liveCM?.isLive
                ? <><ShieldCheck className="w-2.5 h-2.5" /> Live verified</>
                : <><RefreshCw className="w-2.5 h-2.5" /> Verify live</>}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {/* CM Avatar — uses dynamic party theme */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 relative"
            style={{
              background: theme.light,
              border: `2px solid ${theme.border}`,
              color: theme.text,
              boxShadow: theme.glow,
            }}
          >
            {cmName.split(' ').map(w => w[0]).join('').slice(0, 2)}
            {liveCM?.isLive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-900 animate-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-rajdhani)' }}>
              {cmName}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wide"
                style={{ background: theme.badge, color: theme.text, border: `1px solid ${theme.border}` }}
              >
                {state.ruling_party}
              </span>
              <span className="text-xs text-slate-500 truncate">{cmParty}</span>
            </div>
          </div>
        </div>

        {/* Live verification provenance */}
        {liveCM?.isLive && (
          <motion.div
            className="mb-3 px-2.5 py-1.5 rounded-lg text-[10px]"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex items-center gap-1.5 text-green-400">
              <ShieldCheck className="w-3 h-3" />
              <span className="font-semibold">Verified live</span>
              {liveCM.confidence != null && (
                <span className="text-slate-400">· {Math.round(liveCM.confidence * 100)}% confidence</span>
              )}
            </div>
            {liveCM.sources && liveCM.sources.length > 0 && (
              <div className="text-slate-500 mt-0.5 truncate">
                Sources: {liveCM.sources.slice(0, 2).map(s => {
                  try { return new URL(s).hostname.replace('www.', ''); } catch { return s; }
                }).join(', ')}
              </div>
            )}
          </motion.div>
        )}

        {/* AI Insight Button + Result */}
        <AnimatePresence>
          {!aiInsight && !loadingAI && (
            <button
              onClick={() => fetchAIInsight(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition-all text-sm text-violet-300 hover:text-violet-200 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get AI Insights · 3-Model Validated
            </button>
          )}

          {loadingAI && (
            <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-800/40 text-sm text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
              Fetching latest info via Groq AI...
            </div>
          )}

          {aiInsight && (
            <motion.div
              className="rounded-xl overflow-hidden border border-violet-500/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {/* Validation header bar */}
              {validation && (() => {
                const vc = VALIDATION_COLORS[validation.status as keyof typeof VALIDATION_COLORS] || VALIDATION_COLORS.pending;
                return (
                  <div
                    className="flex items-center justify-between px-3 py-1.5 text-xs font-medium"
                    style={{ background: vc.bg, borderBottom: `1px solid ${vc.color}22` }}
                  >
                    <div className="flex items-center gap-1.5" style={{ color: vc.color }}>
                      {validation.status === 'validated'
                        ? <ShieldCheck className="w-3 h-3" />
                        : <AlertTriangle className="w-3 h-3" />}
                      <span>{vc.label}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{validation.modelsUsed} models</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{Math.round(validation.consensusScore * 100)}% consensus</span>
                      {validation.autoCorrected && <span className="text-amber-400">· auto-corrected</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {validation.fromCache && (
                        <span className="text-slate-500">{validation.cacheAge}m cached ·</span>
                      )}
                      <button
                        onClick={() => fetchAIInsight(true)}
                        className="text-slate-500 hover:text-violet-400 transition-colors"
                        title="Force refresh"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Insight text */}
              <div className="p-3 bg-violet-500/5 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-violet-400 font-semibold">LLaMA 3.3 70B + LLaMA 3.1 8B + Gemma2 · Ground-truth anchored</span>
                </div>
                {aiInsight}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* News Feed */}
      <NewsFeed entityName={state.name} entityType="state" />

      {/* Districts List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Select District
          </h3>
          <span className="text-xs text-slate-600">{districts.length} districts</span>
        </div>

        <div className="space-y-1.5">
          {visibleDistricts.map((district, idx) => (
            <motion.button
              key={district.id}
              onClick={() => onDistrictSelect(district)}
              className="w-full glass-card p-3 flex items-center justify-between hover:border-indigo-500/40 hover:bg-slate-800/70 transition-all group text-left"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{district.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {district.mandals_count} mandals · {district.assembly_seats} Vidhan Sabha seats
                    {district.population && ` · ${formatNumber(district.population)}`}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
            </motion.button>
          ))}
        </div>

        {districts.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-2 py-2 rounded-xl border border-slate-700/60 text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-1.5"
          >
            {showAll ? (
              <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> Show all {districts.length} districts</>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
