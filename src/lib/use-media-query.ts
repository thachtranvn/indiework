'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/** The app's single mobile breakpoint. Mirrors `--bp-mobile` in tokens.css. */
export const MOBILE_QUERY = '(max-width: 760px)';

/**
 * SSR-safe `matchMedia`. The server snapshot is always `false`, so the markup
 * matches and hydration is clean; the real value arrives on the first render
 * after hydration.
 *
 * Because of that, this is only for behaviour that can settle one frame late
 * (which slot a panel renders into, whether a resizer exists). Anything that
 * must be right in the first painted frame belongs in a CSS media query.
 */
export function useMediaQuery(query: string): boolean {
  const mql = useMemo(
    () => (typeof window === 'undefined' ? null : window.matchMedia(query)),
    [query],
  );

  const subscribe = useCallback(
    (onChange: () => void) => {
      mql?.addEventListener('change', onChange);
      return () => mql?.removeEventListener('change', onChange);
    },
    [mql],
  );

  return useSyncExternalStore(
    subscribe,
    () => mql?.matches ?? false,
    () => false,
  );
}

/** True on phone-width viewports — the shell switches to drawer + sheet here. */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
