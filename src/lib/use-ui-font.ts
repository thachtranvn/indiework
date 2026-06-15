'use client';

import { useCallback, useEffect, useState } from 'react';
import { FONT_STACK, UI_FONT_DEFAULT, UI_FONT_STORAGE_KEY, fontStackFor } from '@/lib/fonts';

/**
 * Reads/writes the user's UI font preference and applies it live + globally.
 *
 * Stored as a raw string under `iw-ui-font` (not JSON) so the pre-paint boot
 * script in the root layout can read it with a plain `getItem`. On mount we sync
 * React state (for the picker highlight) and re-apply to `--font-ui` on
 * `documentElement`; on change we persist and apply immediately, so the whole
 * app (sidebar, lists, detail panel) reflows to the new face at once.
 */
export function useUiFont(): [string, (id: string) => void] {
  const [font, setFont] = useState<string>(UI_FONT_DEFAULT);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(UI_FONT_STORAGE_KEY);
    } catch {
      // storage unavailable (private mode) — fall back to default
    }
    const id = stored && stored in FONT_STACK ? stored : UI_FONT_DEFAULT;
    setFont(id);
    document.documentElement.style.setProperty('--font-ui', fontStackFor(id));
  }, []);

  const set = useCallback((id: string) => {
    setFont(id);
    document.documentElement.style.setProperty('--font-ui', fontStackFor(id));
    try {
      localStorage.setItem(UI_FONT_STORAGE_KEY, id);
    } catch {
      // ignore write failures (private mode, quota)
    }
  }, []);

  return [font, set];
}
