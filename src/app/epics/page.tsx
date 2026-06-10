'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  BookOpen, ChevronDown, ChevronRight, Loader2, CheckCircle2, Clock
} from 'lucide-react';

interface Epic {
  id: string;
  title: string;
  title_hindi: string;
  description: string;
  book_count: number;
  total_slokas: number;
  author: string;
  period: string;
}

interface Episode {
  id: string;
  epic_id: string;
  book_number: number;
  book_name: string;
  book_name_hindi: string;
  episode_number: number;
  title: string;
  description: string;
  audio_url: string;
  duration_seconds?: number;
  transcript_excerpt?: string;
  language: string;
  narrator?: string;
}

interface ProgressMap {
  [episodeId: string]: { position_seconds: number; completed: boolean };
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('ryl_session');
  if (!id) { id = Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem('ryl_session', id); }
  return id;
}

function formatTime(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const EPIC_GRADIENTS: Record<string, string> = {
  ramayana: 'from-orange-950 via-amber-950 to-stone-950',
  mahabharata: 'from-green-950 via-emerald-950 to-stone-950',
};

const EPIC_ACCENT: Record<string, string> = {
  ramayana: 'text-orange-400',
  mahabharata: 'text-emerald-400',
};

const EPIC_BORDER: Record<string, string> = {
  ramayana: 'border-orange-500/30',
  mahabharata: 'border-emerald-500/30',
};

const EPIC_BG: Record<string, string> = {
  ramayana: 'bg-orange-500/20',
  mahabharata: 'bg-emerald-500/20',
};

export default function EpicsPage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<string>('ramayana');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpics, setLoadingEpics] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedBook, setExpandedBook] = useState<number | null>(1);
  const [progress, setProgress] = useState<ProgressMap>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load epics
  useEffect(() => {
    fetch('/api/epics').then(r => r.json()).then(d => {
      setEpics(d.epics || []);
      setLoadingEpics(false);
    });
  }, []);

  // Load episodes when epic changes
  useEffect(() => {
    if (!selectedEpic) return;
    let cancelled = false;

    // Reset state synchronously before async fetch — valid pattern for sequential effect setup
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEpisodes([]);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentEpisode(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedBook(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingEpisodes(true);

    fetch(`/api/epics/episodes?epicId=${selectedEpic}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setEpisodes(d.episodes || []);
        setLoadingEpisodes(false);
      })
      .catch(() => { if (!cancelled) setLoadingEpisodes(false); });

    const sid = getSessionId();
    if (sid) {
      fetch(`/api/epics/progress?sessionId=${sid}&epicId=${selectedEpic}`)
        .then(r => r.json())
        .then(d => {
          if (cancelled) return;
          const map: ProgressMap = {};
          for (const p of (d.progress || [])) {
            map[p.episode_id] = { position_seconds: p.position_seconds, completed: p.completed };
          }
          setProgress(map);
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [selectedEpic]);

  // Group episodes by book
  const bookGroups = episodes.reduce<Record<number, Episode[]>>((acc, ep) => {
    if (!acc[ep.book_number]) acc[ep.book_number] = [];
    acc[ep.book_number].push(ep);
    return acc;
  }, {});

  const saveProgress = useCallback((episodeId: string, epicId: string, position: number, completed: boolean) => {
    const sid = getSessionId();
    if (!sid) return;
    fetch('/api/epics/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, epicId, episodeId, positionSeconds: Math.floor(position), completed }),
    }).catch(() => {});
    setProgress(prev => ({ ...prev, [episodeId]: { position_seconds: position, completed } }));
  }, []);

  const playEpisode = useCallback((ep: Episode) => {
    setCurrentEpisode(ep);
    setIsPlaying(false);
    setCurrentTime(0);
    setLoading(true);
  }, []);

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;
    audio.src = currentEpisode.audio_url;
    audio.volume = muted ? 0 : volume;

    const saved = progress[currentEpisode.id];
    if (saved?.position_seconds > 10) {
      audio.currentTime = saved.position_seconds;
    }

    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const epicIdSnap = selectedEpic;
    const epIdSnap = currentEpisode.id;
    const onEnded = () => {
      setIsPlaying(false);
      saveProgress(epIdSnap, epicIdSnap, audio.duration, true);
    };
    const onCanPlay = () => setLoading(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode]);

  // Auto-save progress every 10s
  useEffect(() => {
    if (!isPlaying || !currentEpisode) return;
    const epId = currentEpisode.id;
    const epicId = selectedEpic;
    progressSaveRef.current = setInterval(() => {
      const t = audioRef.current?.currentTime ?? 0;
      saveProgress(epId, epicId, t, false);
    }, 10000);
    return () => { if (progressSaveRef.current) clearInterval(progressSaveRef.current); };
  }, [isPlaying, currentEpisode, selectedEpic, saveProgress]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = parseFloat(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const skipBack = () => {
    const allEps = episodes;
    const idx = allEps.findIndex(e => e.id === currentEpisode?.id);
    if (idx > 0) playEpisode(allEps[idx - 1]);
    else if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const skipForward = () => {
    const allEps = episodes;
    const idx = allEps.findIndex(e => e.id === currentEpisode?.id);
    if (idx >= 0 && idx < allEps.length - 1) playEpisode(allEps[idx + 1]);
  };

  const epic = epics.find(e => e.id === selectedEpic);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${EPIC_GRADIENTS[selectedEpic] || 'from-stone-950 to-black'} text-white`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span className="font-bold text-xl tracking-wide">Sacred Epics</span>
            <span className="text-white/40 text-sm">· Audio Library</span>
          </div>

          {/* Epic selector */}
          <div className="flex gap-2">
            {!loadingEpics && epics.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEpic(e.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedEpic === e.id
                    ? `${EPIC_BG[e.id]} ${EPIC_BORDER[e.id]} ${EPIC_ACCENT[e.id]} border`
                    : 'border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
                }`}
              >
                {e.id === 'ramayana' ? 'रामायण' : 'महाभारत'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-40">
        {/* Epic header card */}
        {epic && (
          <motion.div
            key={epic.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${EPIC_BORDER[epic.id]} bg-black/30 backdrop-blur p-6 mb-8`}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Tricolor bar */}
              <div className="flex gap-1.5 my-auto shrink-0">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full"
                    style={{
                      height: 80,
                      background: i === 0 ? '#FF9933' : i === 1 ? '#FFFFFF' : '#138808',
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>

              <div className="flex-1">
                <div className={`text-3xl font-bold mb-1 ${EPIC_ACCENT[epic.id]}`}>
                  {epic.title_hindi}
                </div>
                <div className="text-white/70 text-lg mb-2">{epic.title}</div>
                <p className="text-white/50 text-sm leading-relaxed max-w-2xl">{epic.description}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/40">
                  <span>📖 {epic.book_count} {epic.id === 'ramayana' ? 'Kandas' : 'Parvas'}</span>
                  <span>🙏 {epic.total_slokas.toLocaleString()} Slokas</span>
                  <span>✍️ {epic.author}</span>
                  <span>📅 {epic.period}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Episode list grouped by book */}
        {loadingEpisodes ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(bookGroups).map(([bookNum, eps]) => {
              const num = parseInt(bookNum);
              const isOpen = expandedBook === num;
              const firstEp = eps[0];
              const bookCompleted = eps.every(e => progress[e.id]?.completed);

              return (
                <div
                  key={bookNum}
                  className={`rounded-xl border ${EPIC_BORDER[selectedEpic]} bg-black/30 backdrop-blur overflow-hidden`}
                >
                  {/* Book header */}
                  <button
                    onClick={() => setExpandedBook(isOpen ? null : num)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      bookCompleted ? 'bg-emerald-500/30 text-emerald-400' : `${EPIC_BG[selectedEpic]} ${EPIC_ACCENT[selectedEpic]}`
                    }`}>
                      {bookCompleted ? <CheckCircle2 className="w-4 h-4" /> : num}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{firstEp.book_name}</div>
                      <div className="text-white/40 text-sm">{firstEp.book_name_hindi} · {eps.length} episode{eps.length > 1 ? 's' : ''}</div>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
                  </button>

                  {/* Episodes */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-white/5 divide-y divide-white/5">
                          {eps.map(ep => {
                            const isCurrent = currentEpisode?.id === ep.id;
                            const prog = progress[ep.id];

                            return (
                              <button
                                key={ep.id}
                                onClick={() => playEpisode(ep)}
                                className={`w-full px-5 py-3 flex items-center gap-4 text-left transition-colors ${
                                  isCurrent ? `${EPIC_BG[selectedEpic]}` : 'hover:bg-white/5'
                                }`}
                              >
                                {/* Play indicator */}
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                                  {isCurrent && isPlaying ? (
                                    <div className="flex gap-0.5 items-end h-4">
                                      {[...Array(3)].map((_, i) => (
                                        <div
                                          key={i}
                                          className={`w-1 rounded-full ${EPIC_BG[selectedEpic]} ${EPIC_ACCENT[selectedEpic]} animate-pulse`}
                                          style={{
                                            height: `${[12, 8, 14][i]}px`,
                                            animationDelay: `${i * 0.15}s`,
                                            background: selectedEpic === 'ramayana' ? '#fb923c' : '#34d399',
                                          }}
                                        />
                                      ))}
                                    </div>
                                  ) : prog?.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
                                  ) : (
                                    <Play className={`w-4 h-4 ${isCurrent ? EPIC_ACCENT[selectedEpic] : 'text-white/30'}`} />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium truncate ${isCurrent ? EPIC_ACCENT[selectedEpic] : 'text-white/80'}`}>
                                    {ep.title}
                                  </div>
                                  <div className="text-white/40 text-xs truncate">{ep.description?.slice(0, 80)}…</div>
                                </div>

                                {/* Progress indicator */}
                                {prog && !prog.completed && prog.position_seconds > 5 && (
                                  <div className="flex items-center gap-1 text-white/30 text-xs shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(prog.position_seconds)}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky player */}
      <AnimatePresence>
        {currentEpisode && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {/* Tricolor top bar */}
            <div className="flex h-1">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#138808]" />
            </div>

            <div className="bg-black/95 backdrop-blur-2xl border-t border-white/10 px-4 py-3">
              <div className="max-w-3xl mx-auto">
                {/* Track info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${EPIC_ACCENT[selectedEpic]}`}>
                      {currentEpisode.title}
                    </div>
                    <div className="text-white/40 text-xs">
                      {currentEpisode.book_name} · {currentEpisode.language}
                    </div>
                  </div>
                  <div className="text-white/30 text-xs tabular-nums ml-4">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                {/* Seek bar */}
                <div className="relative mb-3">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={seek}
                    className="w-full h-1 appearance-none bg-white/10 rounded-full cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${selectedEpic === 'ramayana' ? '#fb923c' : '#34d399'} ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) 0%)`,
                    }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={skipBack} className="text-white/50 hover:text-white transition-colors">
                      <SkipBack className="w-5 h-5" />
                    </button>

                    <button
                      onClick={togglePlay}
                      disabled={loading}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        selectedEpic === 'ramayana'
                          ? 'bg-orange-500 hover:bg-orange-400'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>

                    <button onClick={skipForward} className="text-white/50 hover:text-white transition-colors">
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMuted(!muted)} className="text-white/40 hover:text-white transition-colors">
                      {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={muted ? 0 : volume}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        setMuted(false);
                        if (audioRef.current) audioRef.current.volume = v;
                      }}
                      className="w-20 h-1 appearance-none cursor-pointer"
                      style={{ accentColor: selectedEpic === 'ramayana' ? '#fb923c' : '#34d399' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
