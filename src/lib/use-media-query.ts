'use client';

import { useLayoutEffect, useState } from 'react';

/** The app's single mobile breakpoint. Mirrors `--bp-mobile` in tokens.css. */
export const MOBILE_QUERY = '(max-width: 760px)';

/**
 * SSR-safe `matchMedia`. Always `false` on the server and the hydrating
 * client render so markup matches; the real value lands in an effect.
 *
 * `useSyncExternalStore` is the wrong tool here: React still warns when
 * `getSnapshot` (phone = true) differs from `getServerSnapshot` (false),
 * which is exactly the hydration overlay on a real device.
 *
 * Only for behaviour that can settle one frame late. Anything that must be
 * right in the first painted frame belongs in a CSS media query.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True on phone-width viewports — the shell switches to drawer + sheet here. */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}

/**
 * Shared chrome control size (sidebar / tabs / detail header icon buttons).
 * Touch-friendly `sm` on phone; compact `xs` on desktop.
 */
export function useChromeBtnSize(): 'sm' | 'xs' {
  return useIsMobile() ? 'sm' : 'xs';
}
