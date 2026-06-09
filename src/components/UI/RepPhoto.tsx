'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPartyTheme } from '@/lib/colorSystem';

interface RepPhotoProps {
  name: string;
  party_short: string;
  wikipedia_slug?: string;
  size?: number;        // px — default 56
  className?: string;
  showRing?: boolean;
}

/**
 * Smart MP/MLA photo component.
 * Layer 1: Wikipedia REST API  → real politician photo
 * Layer 2: Wikimedia search    → fallback image
 * Layer 3: Initials avatar     → generated from party brand color
 */
export function RepPhoto({
  name,
  party_short,
  wikipedia_slug,
  size = 56,
  className = '',
  showRing = true,
}: RepPhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(!!wikipedia_slug);
  const theme = getPartyTheme(party_short);

  // Initials from name
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  useEffect(() => {
    if (!wikipedia_slug) { setTimeout(() => setLoading(false), 0); return; }
    let cancelled = false;

    fetch(`/api/rep-photo?slug=${encodeURIComponent(wikipedia_slug)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setPhotoUrl(data.url || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [wikipedia_slug]);

  const showPhoto = photoUrl && !failed;

  return (
    <div
      className={`relative flex-shrink-0 rounded-2xl overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        background: showPhoto ? 'transparent' : theme.light,
        border: showRing ? `2px solid ${theme.border}` : undefined,
        boxShadow: showRing ? theme.glow : undefined,
      }}
    >
      {/* Loading shimmer */}
      {loading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: theme.light }}
        />
      )}

      {/* Real Wikipedia photo */}
      {showPhoto && (
        <Image
          src={photoUrl}
          alt={name}
          fill
          className="object-cover object-top"
          onError={() => setFailed(true)}
          sizes={`${size}px`}
          unoptimized // Wikipedia CDN already serves optimised sizes
        />
      )}

      {/* Initials fallback */}
      {!showPhoto && !loading && (
        <div
          className="absolute inset-0 flex items-center justify-center font-bold select-none"
          style={{
            color: theme.text,
            fontSize: size * 0.32,
            background: `linear-gradient(135deg, ${theme.light}, ${theme.badge}44)`,
          }}
        >
          {initials}
        </div>
      )}

      {/* Party badge pill — bottom-right */}
      <div
        className="absolute bottom-0 right-0 text-[8px] font-bold px-1 py-0.5 leading-tight"
        style={{
          background: theme.badge,
          color: theme.text,
          borderTopLeftRadius: 6,
        }}
      >
        {party_short.length > 5 ? party_short.slice(0, 4) : party_short}
      </div>
    </div>
  );
}
