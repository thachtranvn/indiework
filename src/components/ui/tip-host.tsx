'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const EDGE = 8;
const GAP = 6;

interface TipState {
  text: string;
  rect: DOMRect;
}

/**
 * Global instant tooltips for `[data-tip]` — portaled + viewport-clamped so
 * tips near the edge (due dates, right-side chips) never get cropped.
 */
export function TipHost() {
  const [state, setState] = useState<TipState | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = (el: HTMLElement) => {
      const text = el.getAttribute('data-tip')?.trim();
      if (!text) return;
      activeRef.current = el;
      setState({ text, rect: el.getBoundingClientRect() });
    };
    const hide = () => {
      activeRef.current = null;
      setState(null);
      setPos(null);
    };
    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-tip]') as HTMLElement | null;
      if (!el) return;
      if (el === activeRef.current) return;
      show(el);
    };
    const onOut = (e: MouseEvent) => {
      if (!activeRef.current) return;
      const related = e.relatedTarget as Node | null;
      if (related && activeRef.current.contains(related)) return;
      // Leaving into the tip itself shouldn't happen (pointer-events: none).
      const next = (related as Element | null)?.closest?.('[data-tip]');
      if (next === activeRef.current) return;
      hide();
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-tip]') as HTMLElement | null;
      if (el) show(el);
    };
    const onFocusOut = () => hide();
    const onScroll = () => {
      if (activeRef.current) hide();
    };
    const onDown = () => {
      if (activeRef.current) hide();
    };

    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('scroll', onScroll, true);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    if (!state || !tipRef.current) {
      setPos(null);
      return;
    }
    const tip = tipRef.current.getBoundingClientRect();
    const r = state.rect;
    let left = r.left + r.width / 2 - tip.width / 2;
    left = Math.max(EDGE, Math.min(left, window.innerWidth - tip.width - EDGE));

    let top = r.top - tip.height - GAP;
    if (top < EDGE) {
      // Flip below when there isn't room above.
      top = r.bottom + GAP;
    }
    if (top + tip.height > window.innerHeight - EDGE) {
      top = Math.max(EDGE, window.innerHeight - tip.height - EDGE);
    }
    setPos({ left, top });
  }, [state]);

  if (!state || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={tipRef}
      className="iw-tip"
      role="tooltip"
      style={{
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {state.text}
    </div>,
    document.body,
  );
}
