'use client';

/**
 * Subtle Indian flag tricolor ambient background.
 * Renders behind all content — saffron glow top, white center, green glow bottom,
 * with a faint rotating Ashoka Chakra. Very low opacity so it never hurts legibility.
 */
export function FlagBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Saffron glow — top */}
      <div
        className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] rounded-full blur-[120px] opacity-[0.07]"
        style={{ background: 'radial-gradient(ellipse, #FF9933, transparent 70%)' }}
      />
      {/* Green glow — bottom */}
      <div
        className="absolute -bottom-1/3 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] rounded-full blur-[120px] opacity-[0.06]"
        style={{ background: 'radial-gradient(ellipse, #138808, transparent 70%)' }}
      />

      {/* Faint Ashoka Chakra — center watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.025]">
        <svg width="520" height="520" viewBox="0 0 100 100" className="animate-[spin_120s_linear_infinite]">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#3b5bdb" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="7" fill="#3b5bdb" />
          {/* 24 spokes */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x2 = 50 + 44 * Math.cos(angle);
            const y2 = 50 + 44 * Math.sin(angle);
            return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="#3b5bdb" strokeWidth="1" />;
          })}
        </svg>
      </div>
    </div>
  );
}
