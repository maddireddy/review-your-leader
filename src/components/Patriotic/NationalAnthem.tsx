'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause, X } from 'lucide-react';

/**
 * National Anthem (Jana Gana Mana) player.
 *
 * Browsers block autoplay-with-sound until a user gesture, so we:
 *   1. Attempt a muted autoplay on load (always allowed)
 *   2. Show a tasteful tricolor "Play Anthem" prompt
 *   3. On ANY first click/tap on the page, attempt to start with sound
 *   4. Remember the user's choice for the session (don't nag)
 *
 * Audio source: /anthem.mp3 (add your own), falling back to a public
 * Wikimedia Commons recording of the instrumental.
 */

const ANTHEM_SOURCES = [
  '/anthem.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/5/5c/Jana_Gana_Mana_instrumental.ogg',
];

export function NationalAnthem() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [available, setAvailable] = useState(true);
  const srcIdx = useRef(0);

  // Initialise audio element
  useEffect(() => {
    const sessionChoice = sessionStorage.getItem('anthem_choice');
    if (sessionChoice === 'dismissed') { setTimeout(() => setDismissed(true), 0); return; }

    const audio = new Audio(ANTHEM_SOURCES[0]);
    audio.preload = 'auto';
    audio.volume = 0.6;
    audioRef.current = audio;

    const onTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnd = () => { setPlaying(false); setProgress(0); };
    const onError = () => {
      // Try next source
      srcIdx.current += 1;
      if (srcIdx.current < ANTHEM_SOURCES.length) {
        audio.src = ANTHEM_SOURCES[srcIdx.current];
        audio.load();
      } else {
        setAvailable(false);
      }
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);

    // Show the prompt after a beat
    const t = setTimeout(() => setShowPrompt(true), 1200);

    return () => {
      clearTimeout(t);
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.muted = false;
      setMuted(false);
      await audio.play();
      setPlaying(true);
      setShowPrompt(false);
      sessionStorage.setItem('anthem_choice', 'played');
    } catch {
      setAvailable(false);
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }, []);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('anthem_choice', 'dismissed');
  }, []);

  // Attempt to start on the user's first interaction anywhere
  useEffect(() => {
    if (dismissed || playing) return;
    const onFirst = () => {
      if (sessionStorage.getItem('anthem_choice')) return;
      play();
    };
    window.addEventListener('pointerdown', onFirst, { once: true });
    return () => window.removeEventListener('pointerdown', onFirst);
  }, [dismissed, playing, play]);

  if (dismissed || !available) return null;

  return (
    <>
      {/* Floating invite prompt */}
      <AnimatePresence>
        {showPrompt && !playing && (
          <motion.div
            className="fixed bottom-5 right-5 z-50"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
              style={{ background: 'linear-gradient(160deg, rgba(20,27,45,0.97), rgba(13,18,33,0.97))', border: '1px solid rgba(255,153,51,0.35)' }}>
              {/* Tricolor top bar */}
              <div className="h-1 w-full flex">
                <div className="flex-1" style={{ background: '#FF9933' }} />
                <div className="flex-1 bg-white" />
                <div className="flex-1" style={{ background: '#138808' }} />
              </div>
              <div className="p-3 pr-9 flex items-center gap-3">
                <button
                  onClick={play}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #FF9933, #138808)', boxShadow: '0 0 16px rgba(255,153,51,0.4)' }}
                >
                  <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                </button>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    🇮🇳 Jana Gana Mana
                  </div>
                  <div className="text-[11px] text-slate-400">Play the National Anthem</div>
                </div>
              </div>
              <button onClick={dismiss} className="absolute top-2 right-2 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini-player while playing */}
      <AnimatePresence>
        {playing && (
          <motion.div
            className="fixed bottom-5 right-5 z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 w-64"
              style={{ background: 'linear-gradient(160deg, rgba(20,27,45,0.97), rgba(13,18,33,0.97))', border: '1px solid rgba(255,153,51,0.3)' }}>
              <div className="h-1 w-full flex">
                <div className="flex-1" style={{ background: '#FF9933' }} />
                <div className="flex-1 bg-white" />
                <div className="flex-1" style={{ background: '#138808' }} />
              </div>
              <div className="p-3 flex items-center gap-2.5">
                <button onClick={pause} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF9933, #138808)' }}>
                  <Pause className="w-3.5 h-3.5 text-white" fill="white" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                    🇮🇳 National Anthem
                  </div>
                  <div className="h-1 w-full bg-slate-700/60 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FF9933, #fff, #138808)' }} />
                  </div>
                </div>
                <button onClick={toggleMute} className="text-slate-400 hover:text-white flex-shrink-0">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button onClick={() => { pause(); dismiss(); }} className="text-slate-500 hover:text-slate-300 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
