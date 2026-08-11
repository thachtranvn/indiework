import type { ReactNode } from 'react';

/**
 * Tip bubble chrome (Figma Components · Tooltip).
 * Live tips use TipHost + `data-tip` on the trigger; this renders the same
 * surface for forced-visible samples in the design system gallery.
 */
export function Tip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={['iw-tip', 'iw-tip-static', className].filter(Boolean).join(' ')} role="tooltip">
      {children}
    </span>
  );
}
