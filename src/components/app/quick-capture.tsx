'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Ic } from '@/components/ui/icons';

export type QuickCaptureHandle = { submit: () => void };

export const QuickCapture = forwardRef<
  QuickCaptureHandle,
  {
    placeholder?: string;
    /** Fires on every keystroke (and when the field clears after a successful add). */
    onDraftChange?: (value: string) => void;
    /** Returns a truthy value on success; the field clears only then (a failed add
     *  keeps the typed title rather than discarding it). */
    onAdd: (title: string) => Promise<unknown> | void;
  }
>(function QuickCapture({ placeholder = 'Add task...', onAdd, onDraftChange }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);

  const setDraft = useCallback(
    (next: string) => {
      setV(next);
      onDraftChange?.(next);
    },
    [onDraftChange],
  );

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    window.addEventListener('iw:focus-capture', focus);
    return () => window.removeEventListener('iw:focus-capture', focus);
  }, []);

  const submit = useCallback(async () => {
    const title = v.trim();
    if (!title || busy) return;
    setBusy(true);
    try {
      // Clear only on a successful add; a failed capture keeps the typed text.
      if (await onAdd(title)) setDraft('');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }, [v, busy, onAdd, setDraft]);

  useImperativeHandle(ref, () => ({ submit }), [submit]);

  return (
    <div className="qcap">
      <div className="qcap-inner">
        <span className="qcap-plus">
          <Ic.plus size={16} />
        </span>
        <input
          ref={inputRef}
          value={v}
          autoComplete="off"
          suppressHydrationWarning
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape' && v) {
              e.preventDefault();
              setDraft('');
            }
          }}
        />
        <span className="qcap-hint">c</span>
      </div>
    </div>
  );
});
