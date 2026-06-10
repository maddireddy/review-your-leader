'use client';

import { useState } from 'react';
import { Newspaper, ExternalLink, ChevronDown, ChevronUp, Loader2, Languages } from 'lucide-react';

interface NewsArticle {
  title: string;
  summary: string;
  regional_summary?: string;
  regional_lang?: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

function timeAgo(dateStr: string) {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SENTIMENT_COLORS = {
  positive: { color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  negative:  { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  neutral:   { color: '#6B7280', bg: 'rgba(107,114,128,0.06)' },
};

interface NewsFeedProps {
  entityName: string;
  entityType?: 'state' | 'representative';
  stateId?: string;
}

export function NewsFeed({ entityName, entityType = 'state', stateId = '' }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showRegional, setShowRegional] = useState(false);
  const [langLabel, setLangLabel] = useState<string>('');

  async function load() {
    if (fetched) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ name: entityName, type: entityType });
      if (stateId) params.set('stateId', stateId);
      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();
      setArticles(data.articles || []);
      if (data.lang?.native) setLangLabel(data.lang.native);
      setFetched(true);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  }

  function toggle() {
    if (!expanded && !fetched) load();
    setExpanded(!expanded);
  }

  const hasRegional = articles.some(a => a.regional_summary);

  return (
    <div className="glass-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-all"
        onClick={toggle}
      >
        <div className="flex items-center gap-2">
          <Newspaper className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Latest News
          </span>
          {fetched && articles.length > 0 && (
            <span className="bg-sky-500/20 text-sky-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {articles.length}
            </span>
          )}
          {langLabel && (
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              {langLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {loading && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Language toggle */}
          {hasRegional && (
            <div className="flex items-center gap-2 pb-1">
              <Languages className="w-3 h-3 text-slate-500" />
              <button
                onClick={() => setShowRegional(false)}
                className={`text-[10px] px-2 py-0.5 rounded transition-all ${!showRegional ? 'bg-sky-500/20 text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                English
              </button>
              <button
                onClick={() => setShowRegional(true)}
                className={`text-[10px] px-2 py-0.5 rounded transition-all ${showRegional ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {langLabel || 'Regional'}
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-4 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
              Fetching news · translating to regional language…
            </div>
          )}

          {!loading && articles.map((article, i) => {
            const sc = SENTIMENT_COLORS[article.sentiment];
            const displaySummary = showRegional && article.regional_summary
              ? article.regional_summary
              : article.summary;
            return (
              <div
                key={i}
                className="rounded-xl p-2.5 space-y-1"
                style={{ background: sc.bg, border: `1px solid ${sc.color}22` }}
              >
                <div className="text-xs font-medium text-white leading-snug">{article.title}</div>
                <div
                  className={`text-[11px] text-slate-300 leading-relaxed ${showRegional && article.regional_summary ? 'font-medium' : ''}`}
                  style={{ fontFamily: showRegional ? 'system-ui, sans-serif' : undefined }}
                >
                  {displaySummary}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: sc.color }}>
                    {article.source} · {timeAgo(article.published_at)}
                  </span>
                  {article.url !== '#' && (
                    <a href={article.url} target="_blank" rel="noopener"
                      className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-0.5">
                      Read <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          <div className="text-[10px] text-slate-600 text-center pt-1">
            NewsAPI · Groq AI summaries{hasRegional ? ` · Regional translation` : ''} · Updated every 6h
          </div>
        </div>
      )}
    </div>
  );
}
