'use client';

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  import('posthog-js').then(({ default: posthog }) => {
    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: false,
        capture_pageleave: true,
      });
    }
  });
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  import('posthog-js').then(({ default: posthog }) => {
    posthog.capture(event, properties);
  });
}

export const posthog = {
  capture: (event: string, props?: Record<string, unknown>) => trackEvent(event, props),
};
