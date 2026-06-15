'use client';

import { useState } from 'react';
import type { TaskStatus } from '@/lib/domain';
import { Ic } from './icons';

/**
 * Circular checkbox: tick = done, × = cancelled. In-progress shows a pie,
 * in-review a violet 3/4 pie, pending an amber dash (matches the design).
 */
export function CircleCheck({
  done,
  status,
  onToggle,
  size = 18,
}: {
  done: boolean;
  status: TaskStatus;
  onToggle?: () => void;
  size?: number;
}) {
  const cancelled = status === 'cancelled';
  const inProgress = status === 'in_progress' && !done;
  const inReview = status === 'in_review' && !done;
  const pending = status === 'pending' && !done;
  return (
    <button
      className="circle-check"
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      data-done={done ? '' : undefined}
      data-cancelled={cancelled && !done ? '' : undefined}
      data-status={!done && !cancelled ? status : undefined}
      style={{ width: size, height: size }}
      title={done ? 'Mark not done' : 'Mark done'}
      aria-pressed={done}
    >
      {done && <Ic.check size={size - 6} strokeWidth={2.6} />}
      {cancelled && !done && <Ic.close size={size - 8} strokeWidth={2.4} />}
      {inProgress && <span className="cc-pie" />}
      {inReview && <span className="cc-pie cc-review" />}
      {pending && <span className="cc-pend" />}
    </button>
  );
}

/** Monospace reference tag that copies to clipboard on click. */
export function RefTag({ value, big }: { value: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`ref-tag ${big ? 'ref-big' : ''}`}
      title="Copy reference"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1100);
      }}
    >
      {copied ? 'Copied!' : value}
    </button>
  );
}
