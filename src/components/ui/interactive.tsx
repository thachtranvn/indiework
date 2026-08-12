'use client';

import { useState, type MouseEvent } from 'react';
import type { TaskStatus } from '@/lib/domain';
import { useChromeBtnSize } from '@/lib/use-media-query';
import { Ic } from './icons';
import { StatusIcon } from './status-icon';
import { Button } from './button';

/**
 * Circular status control. With `onToggle`, acts as a mark-done button; without,
 * renders a passive mark (for StatusPicker triggers).
 */
export function CircleCheck({
  done,
  status,
  onToggle,
  size = 16,
}: {
  done: boolean;
  status: TaskStatus;
  onToggle?: () => void;
  size?: number;
}) {
  const effective: TaskStatus = done ? 'done' : status;
  const Comp = onToggle ? 'button' : 'span';
  return (
    <Comp
      className="circle-check"
      {...(onToggle
        ? {
            type: 'button' as const,
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              onToggle();
            },
            title: done ? 'Mark not done' : 'Mark done',
            'aria-pressed': done,
          }
        : { 'aria-hidden': true as const })}
      data-st={effective}
      style={{ width: size, height: size }}
    >
      <StatusIcon status={effective} size={size} />
    </Comp>
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

/**
 * Icon button that copies a link to the clipboard, echoing RefTag's copy
 * micro-interaction (swaps to a check for ~1.1s). `getUrl` is resolved at click
 * time — not on render — so callers can safely read `window.location.origin`
 * without breaking SSR. A null url (e.g. an Inbox task with no ref) is a no-op.
 */
export function CopyLinkButton({ getUrl, label = 'Copy link' }: { getUrl: () => string | null; label?: string }) {
  const [copied, setCopied] = useState(false);
  const btnSize = useChromeBtnSize();
  return (
    <Button
      type="button"
      iconOnly
      size={btnSize}
      variant="tertiary"
      title={copied ? 'Link copied' : label}
      aria-label={label}
      leftIcon={copied ? <Ic.check size={16} /> : <Ic.link size={16} />}
      onClick={async (e) => {
        e.stopPropagation();
        const url = getUrl();
        if (!url) return;
        try {
          await navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1100);
        } catch {
          // Clipboard unavailable (denied permission / insecure context) — skip.
        }
      }}
    />
  );
}
