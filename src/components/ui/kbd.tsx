import type { ReactNode } from 'react';

/**
 * Keyboard shortcut badge. Text is always uppercase via CSS so callers can
 * pass the literal key (`c`, `esc`, `⌘K`) without hand-casing.
 */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={['iw-kbd', className].filter(Boolean).join(' ')}>{children}</kbd>;
}
