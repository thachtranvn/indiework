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

/** Days from today to due (negative = overdue). */
export function dueDaysFromToday(d: Date | string | null | undefined): number | null {
  const dt = toDate(d);
  if (!dt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - today.getTime()) / 86_400_000);
}

/** Tooltip for due date: "Due Jul 18, 2026 · in 5 days" / "· 3 days ago" / "· today". */
export function dueTooltip(d: Date | string | null | undefined): string {
  const date = fmtDate(d, { month: 'short', day: 'numeric', year: 'numeric' });
  if (!date) return '';
  const days = dueDaysFromToday(d);
  if (days == null) return `Due ${date}`;
  if (days === 0) return `Due ${date} · today`;
  if (days === 1) return `Due ${date} · in 1 day`;
  if (days > 1) return `Due ${date} · in ${days} days`;
  if (days === -1) return `Due ${date} · 1 day ago`;
  return `Due ${date} · ${Math.abs(days)} days ago`;
}
