/** Date helpers shared by task rows, due pills, milestone cards. */

export function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
  const dt = new Date(d.length <= 10 ? `${d}T00:00:00` : d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function fmtDate(
  d: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  const dt = toDate(d);
  return dt ? dt.toLocaleDateString('en-US', opts) : '';
}

/** Short day label for the activity timeline, e.g. "6/13". */
export function fmtDay(d: Date | string | null | undefined): string {
  return fmtDate(d, { month: 'numeric', day: 'numeric' });
}

/** For the YYYY-MM-DD value of a <input type="date">. */
export function toDateInputValue(d: Date | string | null | undefined): string {
  const dt = toDate(d);
  if (!dt) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type DueState = 'overdue' | 'soon' | 'later';

export function dueState(d: Date | string | null | undefined): DueState | null {
  const dt = toDate(d);
  if (!dt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((dt.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'soon';
  return 'later';
}
