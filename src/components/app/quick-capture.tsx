'use client';

import { useEffect, useRef, useState } from 'react';
import { Ic } from '@/components/ui/icons';

export function QuickCapture({
  placeholder = 'Add a task…',
  onAdd,
}: {
  placeholder?: string;
  onAdd: (title: string) => Promise<void> | void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const focus = () => ref.current?.focus();
    window.addEventListener('iw:focus-capture', focus);
    return () => window.removeEventListener('iw:focus-capture', focus);
  }, []);

  const submit = async () => {
    const title = v.trim();
    if (!title || busy) return;
    setBusy(true);
    try {
      await onAdd(title);
      setV('');
    } finally {
      setBusy(false);
      ref.current?.focus();
    }
  };

  return (
    <div className="qcap">
      <div className="qcap-inner">
        <span className="qcap-plus">
          <Ic.plus size={18} />
        </span>
        <input
          ref={ref}
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <span className="qcap-hint">c</span>
      </div>
    </div>
  );
}
