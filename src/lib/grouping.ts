/**
 * Grouping engine for the task list (ported from the design prototype).
 * Given a primary (and optional secondary) axis, expand tasks into ordered
 * buckets. Each bucket knows how to MATCH a task and what PATCH to apply to a
 * task created inside it.
 */
import type { TaskDto } from '@/server/services';
import {
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_RANK,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/domain';

export type GroupDim = 'module' | 'milestone' | 'status' | 'priority' | 'none';
export type IconName = 'cube' | 'target' | 'flag';

export interface GroupModule {
  id: string;
  name: string;
  color: string | null;
}
export interface GroupMilestone {
  id: string;
  name: string;
  status: string;
  targetDate: Date | string | null;
}

export interface Filters {
  status: TaskStatus[];
  priority: TaskPriority[];
  hideDone: boolean;
}

export type NewTaskPatch = Partial<{
  moduleId: string | null;
  milestoneId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
}>;

export interface Section {
  id: string;
  name: string;
  color?: string;
  icon?: IconName;
  target?: Date | string | null;
  defaultOpen: boolean;
  keep: boolean;
  patch: NewTaskPatch;
  tasks: TaskDto[];
  subs?: Section[];
}

interface Bucket {
  key: string;
  name: string;
  color?: string;
  icon?: IconName;
  target?: Date | string | null;
  defaultOpen: boolean;
  keep: boolean;
  patch: NewTaskPatch;
  match: (t: TaskDto) => boolean;
}

export function computeAvailDims(modules: GroupModule[], milestones: GroupMilestone[]): GroupDim[] {
  const dims: GroupDim[] = [];
  if (modules.length) dims.push('module');
  if (milestones.length) dims.push('milestone');
  dims.push('status', 'priority');
  return dims;
}

function groupSpec(dim: GroupDim, modules: GroupModule[], milestones: GroupMilestone[]): Bucket[] | null {
  if (dim === 'module') {
    const g: Bucket[] = modules.map((m) => ({
      key: m.id,
      name: m.name,
      color: m.color ?? undefined,
      defaultOpen: true,
      keep: false,
      patch: { moduleId: m.id },
      match: (t) => t.moduleId === m.id,
    }));
    g.push({
      key: '__nomod',
      name: 'No module',
      icon: 'cube',
      keep: true,
      defaultOpen: true,
      patch: { moduleId: null },
      match: (t) => !t.moduleId,
    });
    return g;
  }
  if (dim === 'milestone') {
    const g: Bucket[] = milestones.map((m) => ({
      key: m.id,
      name: m.name,
      icon: 'target',
      target: m.targetDate,
      defaultOpen: m.status !== 'done',
      keep: false,
      patch: { milestoneId: m.id },
      match: (t) => t.milestoneId === m.id,
    }));
    g.push({
      key: '__nomile',
      name: 'No milestone',
      icon: 'target',
      keep: true,
      defaultOpen: true,
      patch: { milestoneId: null },
      match: (t) => !t.milestoneId,
    });
    return g;
  }
  if (dim === 'status') {
    return TASK_STATUS.filter((s) => s !== 'inbox').map((s) => ({
      key: s,
      name: TASK_STATUS_LABEL[s],
      color: `var(--st-${s})`,
      defaultOpen: s !== 'done' && s !== 'cancelled',
      keep: false,
      patch: { status: s },
      match: (t) => t.status === s,
    }));
  }
  if (dim === 'priority') {
    return [...TASK_PRIORITY].reverse().map((p) => ({
      key: p,
      name: TASK_PRIORITY_LABEL[p],
      icon: 'flag',
      defaultOpen: true,
      keep: false,
      patch: { priority: p },
      match: (t) => t.priority === p,
    }));
  }
  return null;
}

function sortTasks(a: TaskDto, b: TaskDto): number {
  return (
    Number(a.done) - Number(b.done) ||
    TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority] ||
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function buildSections(
  tasks: TaskDto[],
  primary: GroupDim,
  secondary: GroupDim,
  filters: Filters,
  modules: GroupModule[],
  milestones: GroupMilestone[],
): Section[] {
  const pass = (t: TaskDto) => {
    if (filters.status.length && !filters.status.includes(t.status)) return false;
    if (filters.priority.length && !filters.priority.includes(t.priority)) return false;
    if (filters.hideDone && (t.done || t.status === 'cancelled')) return false;
    return true;
  };
  const ptasks = tasks.filter(pass);

  const primGroups = groupSpec(primary, modules, milestones);
  if (!primGroups) {
    return [{ id: '__all', name: '', defaultOpen: true, keep: true, patch: {}, tasks: ptasks.slice().sort(sortTasks) }];
  }

  const subDim = secondary !== 'none' && secondary !== primary ? secondary : null;

  return primGroups.map((g) => {
    const groupTasks = ptasks.filter(g.match).sort(sortTasks);
    const sec: Section = {
      id: g.key,
      name: g.name,
      color: g.color,
      icon: g.icon,
      target: g.target,
      defaultOpen: g.defaultOpen,
      keep: g.keep,
      patch: g.patch,
      tasks: groupTasks,
    };
    if (subDim) {
      const subGroups = groupSpec(subDim, modules, milestones) ?? [];
      sec.subs = subGroups
        .map((sg) => ({
          id: `${g.key}::${sg.key}`,
          name: sg.name,
          color: sg.color,
          icon: sg.icon,
          target: sg.target,
          defaultOpen: true,
          keep: false,
          patch: { ...g.patch, ...sg.patch },
          tasks: groupTasks.filter(sg.match),
        }))
        .filter((s) => s.tasks.length > 0);
    }
    return sec;
  });
}
