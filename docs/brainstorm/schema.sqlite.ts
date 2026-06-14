/**
 * SQLite schema (DEFAULT driver — for open-source / easy self-host).
 *
 * Conventions for portability with the postgres schema:
 *  - PK: integer autoincrement (internal only, never exposed externally)
 *  - public identity = ref "PRJA-3" built from project.key + task.seq
 *  - enums: text + CHECK via drizzle `{ enum }` (type-safe at TS layer)
 *  - timestamps: integer epoch (mode: 'timestamp') → JS Date in app
 *  - booleans/null semantics kept identical to postgres.ts
 *
 * Enable WAL + busy_timeout at connection time (see db/index.ts), not here.
 */

import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
import {
  TASK_STATUS,
  TASK_PRIORITY,
  MILESTONE_STATUS,
  COMMENT_SOURCE,
  DEFAULT_TASK_STATUS,
  DEFAULT_TASK_PRIORITY,
  DEFAULT_MILESTONE_STATUS,
} from './shared';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
};

// ---- projects ----
export const projects = sqliteTable(
  'projects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull(), // "PRJA" — uppercase, validated in service
    name: text('name').notNull(),
    icon: text('icon'), // emoji, vd "🚀"
    description: text('description'),
    color: text('color'),
    statusNote: text('status_note'), // "project đang ở đâu" (overwrite)
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (t) => [uniqueIndex('projects_key_unique').on(t.key)],
);

// ---- project_counters (cấp seq per-project, atomic) ----
export const projectCounters = sqliteTable('project_counters', {
  projectId: integer('project_id')
    .primaryKey()
    .references(() => projects.id, { onDelete: 'cascade' }),
  nextSeq: integer('next_seq').notNull().default(1),
});

// ---- milestones (= PHASE) ----
export const milestones = sqliteTable(
  'milestones',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', { enum: MILESTONE_STATUS })
      .notNull()
      .default(DEFAULT_MILESTONE_STATUS),
    targetDate: integer('target_date', { mode: 'timestamp' }),
    position: integer('position').notNull().default(0),
    ...timestamps,
  },
  (t) => [index('milestones_project_idx').on(t.projectId)],
);

// ---- modules (= SUB-SYSTEM) ----
export const modules = sqliteTable(
  'modules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    position: integer('position').notNull().default(0),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (t) => [index('modules_project_idx').on(t.projectId)],
);

// ---- tasks ----
export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    // project_id NULL = Inbox (chưa triage)
    projectId: integer('project_id').references(() => projects.id, {
      onDelete: 'cascade',
    }),
    moduleId: integer('module_id').references(() => modules.id, {
      onDelete: 'set null',
    }),
    milestoneId: integer('milestone_id').references(() => milestones.id, {
      onDelete: 'set null',
    }),
    seq: integer('seq'), // null khi ở Inbox; cấp khi gán vào project
    title: text('title').notNull(),
    description: text('description'), // markdown
    status: text('status', { enum: TASK_STATUS })
      .notNull()
      .default(DEFAULT_TASK_STATUS),
    priority: text('priority', { enum: TASK_PRIORITY })
      .notNull()
      .default(DEFAULT_TASK_PRIORITY),
    statusNote: text('status_note'), // "đang vướng gì" (overwrite)
    position: integer('position').notNull().default(0),
    dueDate: integer('due_date', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (t) => [
    // ref uniqueness + fast getByRef
    uniqueIndex('tasks_project_seq_unique').on(t.projectId, t.seq),
    index('tasks_project_status_idx').on(t.projectId, t.status),
    index('tasks_module_idx').on(t.moduleId),
    index('tasks_milestone_idx').on(t.milestoneId),
  ],
);

// ---- comments (= timeline / nhật ký, append-only) ----
export const comments = sqliteTable(
  'comments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    body: text('body').notNull(), // markdown
    source: text('source', { enum: COMMENT_SOURCE }).notNull().default('web'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('comments_task_idx').on(t.taskId)],
);
