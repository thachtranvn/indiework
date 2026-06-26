'use client';

/**
 * Failure feedback & reconciliation surface (perceived-performance PP-F1/F2/F3).
 *
 * ADR 0002 shipped a *silent* revert: React reverts the optimistic value on a
 * thrown action, but the user is never told and cannot retry. That is fine on a
 * near-zero-failure local DB and broken on remote Supabase (timeouts, dropped
 * connections, contention). This module closes the gap:
 *
 *  - `notifyError` → a visible, dismissable error toast tied to the failed
 *    action (PP-F1), optionally with a Retry affordance (PP-F2).
 *  - `beginPending` → a global in-flight counter that drives a delayed
 *    "still saving…" indicator after ~1 s, so a slow save isn't mistaken for a
 *    frozen UI (PP-F3). Server Actions serialise per client (solution.md §2), so
 *    one counter spanning the queued tail correctly covers a burst.
 *
 * Two runner hooks layer over this, matching the two mutation shapes:
 *  - `useRun`           — plain action + error toast (creates, detail edits,
 *    overview config, forms). Idempotent updates default to a retry path.
 *  - `useOptimisticRun` — the ADR 0002 optimistic gesture (board drag, list/inbox
 *    toggle, bulk). React auto-reverts the optimistic value on throw; we add the
 *    toast + a retry that re-applies the whole gesture.
 */

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Ic } from './icons';

/** A still-pending write only reveals the "saving…" affordance after this long. */
const SLOW_SAVE_MS = 1000;
/** Non-error toasts auto-dismiss; errors persist until dismissed or retried. */
const AUTO_DISMISS_MS = 5000;
const DEFAULT_ERROR = "Couldn't save your change. It's been rolled back.";

type ToastKind = 'error' | 'info' | 'success';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}

interface FeedbackApi {
  /** Show a toast; returns its id. */
  notify: (toast: Omit<Toast, 'id'>) => number;
  /** Show an error toast tied to a failed action, with an optional Retry action. */
  notifyError: (message: string, retry?: () => void) => number;
  dismiss: (id: number) => void;
  /** Mark a write in-flight; call the returned fn exactly once when it settles. */
  beginPending: () => () => void;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within <FeedbackProvider>');
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saving, setSaving] = useState(false);
  const idRef = useRef(0);
  // A continuous-pending counter (not per-gesture): the slow-save timer is armed
  // on the 0→1 edge and cleared on the →0 edge, so intermediate count changes
  // during a draining burst don't reset it.
  const pendingRef = useRef(0);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = (idRef.current += 1);
      setToasts((ts) => [...ts, { ...toast, id }]);
      if (toast.kind !== 'error') {
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      }
      return id;
    },
    [dismiss],
  );

  const notifyError = useCallback(
    (message: string, retry?: () => void) =>
      notify({ kind: 'error', message, action: retry ? { label: 'Retry', onClick: retry } : undefined }),
    [notify],
  );

  const beginPending = useCallback(() => {
    pendingRef.current += 1;
    if (pendingRef.current === 1 && slowTimerRef.current == null) {
      slowTimerRef.current = setTimeout(() => {
        slowTimerRef.current = null;
        setSaving(true);
      }, SLOW_SAVE_MS);
    }
    let settled = false;
    return () => {
      if (settled) return;
      settled = true;
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      if (pendingRef.current === 0) {
        if (slowTimerRef.current != null) {
          clearTimeout(slowTimerRef.current);
          slowTimerRef.current = null;
        }
        setSaving(false);
      }
    };
  }, []);

  useEffect(
    () => () => {
      if (slowTimerRef.current != null) clearTimeout(slowTimerRef.current);
    },
    [],
  );

  return (
    <FeedbackContext.Provider value={{ notify, notifyError, dismiss, beginPending }}>
      {children}
      <ToastViewport toasts={toasts} saving={saving} dismiss={dismiss} />
    </FeedbackContext.Provider>
  );
}

function ToastViewport({
  toasts,
  saving,
  dismiss,
}: {
  toasts: Toast[];
  saving: boolean;
  dismiss: (id: number) => void;
}) {
  // The provider mounts during SSR; defer the portal until the client has the DOM.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="toast-viewport">
      {saving && (
        <div className="toast toast-saving" role="status" aria-live="polite">
          <span className="toast-spin" aria-hidden>
            <Ic.loader size={15} />
          </span>
          <span className="toast-msg">Still saving…</span>
        </div>
      )}
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.kind}`}
          role={t.kind === 'error' ? 'alert' : 'status'}
          aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
        >
          {t.kind === 'error' && (
            <span className="toast-icon" aria-hidden>
              <Ic.alert size={16} />
            </span>
          )}
          <span className="toast-msg">{t.message}</span>
          {t.action && (
            <button
              className="toast-action"
              type="button"
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button className="toast-close" type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <Ic.close size={15} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

interface RunOptions {
  /** Message shown if the action fails. */
  error?: string;
  /** Offer a Retry that re-runs the action. Default true. Pass false for creates
   *  (a retry could duplicate a write whose response was merely lost). */
  retry?: boolean;
}

/**
 * Run a plain (non-optimistic) action with pending tracking + an error toast.
 * Returns the action's resolved value, or `undefined` if it failed. Used for
 * creates, detail-panel edits, overview config, and forms.
 */
export function useRun() {
  const { notifyError, beginPending } = useFeedback();
  return useCallback(
    <T,>(thunk: () => Promise<T>, opts: RunOptions = {}): Promise<T | undefined> => {
      const attempt = (): Promise<T | undefined> => {
        const end = beginPending();
        return thunk().then(
          (value) => {
            end();
            return value;
          },
          () => {
            end();
            notifyError(opts.error ?? DEFAULT_ERROR, opts.retry === false ? undefined : () => void attempt());
            return undefined;
          },
        );
      };
      return attempt();
    },
    [notifyError, beginPending],
  );
}

/**
 * Run an optimistic gesture (ADR 0002) with failure feedback. `applyOptimistic`
 * is a `useOptimistic` dispatcher bound to the calling surface. On throw, React
 * reverts the optimistic value to server truth (the action didn't revalidate);
 * we surface a toast whose Retry re-applies the whole gesture in a fresh
 * transition.
 */
export function useOptimisticRun<A>(applyOptimistic: (action: A) => void) {
  const { notifyError, beginPending } = useFeedback();
  return useCallback(
    (optimistic: A, thunk: () => Promise<unknown>, error?: string) => {
      const attempt = () => {
        startTransition(async () => {
          applyOptimistic(optimistic);
          const end = beginPending();
          try {
            await thunk();
          } catch {
            notifyError(error ?? DEFAULT_ERROR, () => attempt());
          } finally {
            end();
          }
        });
      };
      attempt();
    },
    [applyOptimistic, notifyError, beginPending],
  );
}

/**
 * Like `useOptimisticRun`, but for the return-row reconcile path (PP-B4): the
 * action returns the authoritative changed row(s) and the surface skips the
 * full `revalidatePath` re-read. `applyOptimistic` paints the prediction during
 * the transition; `commit` writes the server's returned value into the client
 * task mirror so it **survives** the transition ending (no refetch). On throw,
 * nothing is committed and the optimistic value reverts to the mirror's last
 * truth — same return-to-truth + Retry as the optimistic runner. Composes with
 * `useReconciledTasks` (which owns the mirror + `commit`).
 */
export function useReconcileRun<A, R>(applyOptimistic: (action: A) => void, commit: (result: R) => void) {
  const { notifyError, beginPending } = useFeedback();
  return useCallback(
    (optimistic: A, thunk: () => Promise<R>, error?: string) => {
      const attempt = () => {
        startTransition(async () => {
          applyOptimistic(optimistic);
          const end = beginPending();
          try {
            commit(await thunk());
          } catch {
            notifyError(error ?? DEFAULT_ERROR, () => attempt());
          } finally {
            end();
          }
        });
      };
      attempt();
    },
    [applyOptimistic, commit, notifyError, beginPending],
  );
}
