'use client';

/**
 * Segment-level error boundary for the app (perceived-performance PP-F1).
 *
 * The toast layer (`useRun`/`useOptimisticRun`) catches *action* failures and
 * keeps the surface alive. This boundary is the backstop for the other class of
 * failure — an error thrown while a route's data loads or renders (e.g. a query
 * fault, or a Server Action version-skew after a deploy). Instead of a blank
 * screen it offers an explicit message and a one-click retry that re-runs the
 * segment, so the user is never stranded.
 */
import { useEffect } from 'react';
import { Ic } from '@/components/ui/icons';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the detail in dev/observability; the user sees the friendly copy below.
    console.error('[app] route error:', error);
  }, [error]);

  return (
    <div className="empty" role="alert">
      <div className="empty-emoji" aria-hidden>
        <Ic.alert size={40} />
      </div>
      <h3>Something went wrong loading this view</h3>
      <p>The page hit an error while loading. This is usually temporary — try again.</p>
      <button className="btn btn-primary" type="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
