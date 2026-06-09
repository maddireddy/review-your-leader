'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for PWA / offline support.
 * Renders nothing.
 */
export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failed — app still works without offline support
      });
    }
  }, []);

  return null;
}
