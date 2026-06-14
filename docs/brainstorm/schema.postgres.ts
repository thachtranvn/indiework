/**
 * Postgres schema (for self-host on your own server w/ existing
 * pg_dump → R2 backup pipeline).
 *
 * Mirrors schema.sqlite.ts 1:1 in shape so the service layer is
 * dialect-agnostic. Differences are only in column builders:
 *  - PK: integer generated always as identity (not serial)
 *  - timestamps: timestamp with timezone, default now()
 *  - enums: still text + drizzle `{ enum }` (NOT native pg enum) so the
 *    two dialects stay byte-compatible and migrations stay simple.
 *    (Native pg enums add migration friction for zero benefit here.)
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  integer,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
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
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

// ---- projects ----
export const projects = pgTable(
  'projects',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    icon: text('icon'),
    description: text('description'),
    color: text('color'),
    statusNote: text('status_note'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('projects_key_unique').on(t.key)],
);

// ---- project_counters ----
export const projectCounters = pgTable('project_counters', {
  projectId: integer('project_id')
    .primaryKey()
    .references(() => projects.id, { onDelete: 'cascade' }),
  nextSeq: integer('next_seq').notNull().default(1),
});

// ---- milestones (= PHASE) ----
export const milestones = pgTable(
  'milestones',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', { enum: MILESTONE_STATUS })
      .notNull()
      .default(DEFAULT_MILESTONE_STATUS),
    targetDate: timestamp('target_date', { withTimezone: true }),
    position: integer('position').notNull().default(0),
    ...timestamps,
  },
  (t) => [index('milestones_project_idx').on(t.projectId)],
);

// ---- modules (= SUB-SYSTEM) ----
export const modules = pgTable(
  'modules',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    position: integer('position').notNull().default(0),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('modules_project_idx').on(t.projectId)],
);

// ---- tasks ----
export const tasks = pgTable(
  'tasks',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    projectId: integer('project_id').references(() => projects.id, {
      onDelete: 'cascade',
    }), // NULL = Inbox
    moduleId: integer('module_id').references(() => modules.id, {
      onDelete: 'set null',
    }),
    milestoneId: integer('milestone_id').references(() => milestones.id, {
      onDelete: 'set null',
    }),
    seq: integer('seq'),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: TASK_STATUS })
      .notNull()
      .default(DEFAULT_TASK_STATUS),
    priority: text('priority', { enum: TASK_PRIORITY })
      .notNull()
      .default(DEFAULT_TASK_PRIORITY),
    statusNote: text('status_note'),
    position: integer('position').notNull().default(0),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('tasks_project_seq_unique').on(t.projectId, t.seq),
    index('tasks_project_status_idx').on(t.projectId, t.status),
    index('tasks_module_idx').on(t.moduleId),
    index('tasks_milestone_idx').on(t.milestoneId),
  ],
);

// ---- comments ----
export const comments = pgTable(
  'comments',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    source: text('source', { enum: COMMENT_SOURCE }).notNull().default('web'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('comments_task_idx').on(t.taskId)],
);
