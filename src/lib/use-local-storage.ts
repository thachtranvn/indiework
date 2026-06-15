'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * SSR-safe localStorage state. Renders `initial` on the server and the first
 * client paint, then hydrates from storage in an effect (so markup matches and
 * there's no hydration mismatch). All IndieWork keys are namespaced `iw-*`.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore malformed / unavailable storage
    }
    // re-read when the key changes (e.g. switching projects)
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore write failures (private mode, quota)
        }
        return next;
      });
    },
    [key],
  );

  return [value, set];
}
