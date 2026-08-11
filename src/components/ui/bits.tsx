/** Presentational design bits — pure render, safe in server or client trees. */
import {
  TASK_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/domain';
import { fmtDate, dueState, toDate } from '@/lib/dates';
import { Ic, iconByName, isEmojiValue } from './icons';
import { DynamicLucide } from './dyn-icon';
import { StatusIcon } from './status-icon';
import type { ReactNode } from 'react';

/**
 * Renders a project/module identity icon from a single stored value:
 *  - empty        → a color dot
 *  - emoji/glyph  → the glyph, verbatim
 *  - facade key   → curated `Ic` icon (checked first; handles legacy aliases
 *                   like `cube`→Box, `sparkle`→Sparkles)
 *  - kebab name   → lazy full-library Lucide icon
 * Lucide branches are tinted with `color`; emoji glyphs render in their own hue.
 */
export function EntityIcon({
  icon,
  color,
  size = 13,
}: {
  icon?: string | null;
  color?: string | null;
  size?: number;
}) {
  if (!icon) return <span className="dot" style={{ background: color ?? 'var(--text-placeholder)' }} />;
  if (isEmojiValue(icon)) {
    return (
      <span className="ei-emoji" style={{ fontSize: size + 2 }}>
        {icon}
      </span>
    );
  }
  if (icon in Ic) {
    const IconC = iconByName(icon);
    return (
      <span className="mod-ic" style={color ? { color } : undefined}>
        <IconC size={size} />
      </span>
    );
  }
  return (
    <span className="mod-ic" style={color ? { color } : undefined}>
      <DynamicLucide name={icon} size={size} />
    </span>
  );
}

/** Back-compat alias — many call sites still import `ModuleIcon`. */
export const ModuleIcon = EntityIcon;

export function StatusChip({
  status,
  size = 'md',
  showDot = true,
}: {
  status: TaskStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
}) {
  return (
    <span className={`chip st-chip ${size === 'sm' ? 'chip-sm' : ''}`} data-st={status}>
      {showDot && <StatusIcon status={status} size={size === 'sm' ? 14 : 16} />}
      {TASK_STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBars({
  priority,
  showLabel = false,
}: {
  priority: TaskPriority;
  showLabel?: boolean;
}) {
  const mark =
    priority === 'urgent' ? (
      // Figma Priority / Urgent — rounded square with bang (exported asset).
      <img className="pri-urgent" src="/icons/priority-urgent.svg" alt="" width={16} height={16} />
    ) : (
      <span className="pri-bars" data-pri={priority}>
        <i />
        <i />
        <i />
      </span>
    );

  return (
    <span
      className="pri-wrap"
      title={priority === 'none' ? 'No priority' : `Priority: ${TASK_PRIORITY_LABEL[priority]}`}
    >
      {mark}
      {showLabel && (
        <span className="pri-label" data-pri={priority}>
          {TASK_PRIORITY_LABEL[priority]}
        </span>
      )}
    </span>
  );
}

/** Same three flat ticks as priority "None" — used for No module / No milestone. */
export function NoneMark() {
  return (
    <span className="pri-bars" data-pri="none" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

export function ModuleTag({
  name,
  color,
  icon,
  faint,
}: {
  name: string;
  color?: string | null;
  icon?: string | null;
  faint?: boolean;
}) {
  return (
    <MetaPill
      icon={<ModuleIcon icon={icon} color={icon ? undefined : color} size={14} />}
      label={name}
      className={`module-pill${faint ? ' meta-pill-faint' : ''}`}
    />
  );
}

/** Marker-pin icon used by phase chips in the redesigned task row. */
export function PhaseIcon({ size = 14 }: { size?: number }) {
  return (
    <span className="phase-icon" style={{ width: size, height: size }}>
      <img src="/icons/phase-marker.svg" alt="" width={size} height={size} draggable={false} />
    </span>
  );
}

/** Figma calendar glyph used by due-date controls in the properties rail. */
export function CalendarIcon({ size = 16 }: { size?: number }) {
  return (
    <span className="cal-icon" style={{ width: size, height: size }}>
      <img src="/icons/calendar.svg" alt="" width={size} height={size} draggable={false} />
    </span>
  );
}

export function MilestoneTag({ name }: { name: string }) {
  const short = name.split(' · ')[0];
  return <MetaPill icon={<PhaseIcon />} label={short} title={name} className="phase-pill" />;
}

/** Bordered pill used for module / milestone / subtask meta on task rows. */
export function MetaPill({
  icon,
  label,
  title,
  className,
}: {
  icon?: ReactNode;
  label: string;
  title?: string;
  className?: string;
}) {
  return (
    <span className={className ? `meta-pill ${className}` : 'meta-pill'} data-tip={title || undefined}>
      {icon}
      <span className="meta-pill-label">{label}</span>
    </span>
  );
}

export function DuePill({ due, muted }: { due: Date | string | null | undefined; muted?: boolean }) {
  if (!due) return null;
  const { label, state } = dueLabel(due);
  // A closed task's deadline is just history — never flag it overdue/soon (red/amber).
  return (
    <span className="meta-pill meta-pill-ghost due-pill" data-due={muted ? undefined : (state ?? undefined)}>
      <span className="meta-pill-label">{label}</span>
    </span>
  );
}

/** Due label text as shown on task rows (Today / Tomorrow / Jun 8). */
export function duePillLabel(due: Date | string | null | undefined): string | null {
  if (!due) return null;
  return dueLabel(due).label;
}

/** Relative due label for task rows: Today / Tomorrow / Jun 8. */
function dueLabel(due: Date | string): { label: string; state: string | null } {
  const dt = toDate(due);
  if (!dt) return { label: fmtDate(due), state: dueState(due) };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((dt.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return { label: 'Today', state: 'today' };
  if (days === 1) return { label: 'Tomorrow', state: 'tomorrow' };
  if (days < 0) return { label: fmtDate(due), state: 'overdue' };
  if (days <= 3) return { label: fmtDate(due), state: 'soon' };
  return { label: fmtDate(due), state: 'later' };
}

export function Progress({
  value,
  width = 56,
  tone = 'accent',
}: {
  value: number;
  width?: number;
  tone?: 'accent' | 'done';
}) {
  return (
    <span className="progress" style={{ width }}>
      <span
        className="progress-fill"
        data-tone={tone}
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
      />
    </span>
  );
}

/** Circular progress ring (Figma section-head / subtask pill). */
export function ProgressRing({ value, size = 14 }: { value: number; size?: number }) {
  const stroke = 2.25;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  return (
    <svg className="progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      {pct > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--st-done)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  );
}
