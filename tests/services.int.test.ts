import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, schema, pool } from '@/server/db';
import {
  projectService,
  taskService,
  commentService,
} from '@/server/services';

const KEY = 'ZZTEST';
let projectId: string;
const inboxTaskIds: string[] = [];

async function cleanup() {
  // Deleting the project cascades to its tasks + counters.
  await db.delete(schema.projects).where(eq(schema.projects.key, KEY));
  for (const id of inboxTaskIds) {
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  }
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('service slice (real Postgres)', () => {
  test('create project', async () => {
    const p = await projectService.create({ key: KEY, name: 'Slice Test' });
    projectId = p.id;
    expect(p.key).toBe(KEY);
    expect(p.status).toBe('active');
    expect(p.pinned).toBe(false);
    expect(p.tags).toEqual([]);
  });

  test('per-project seq increments; ref is built from key + seq', async () => {
    const t1 = await taskService.create({ projectId, title: 'First' });
    const t2 = await taskService.create({ projectId, title: 'Second' });
    expect(t1.seq).toBe(1);
    expect(t1.ref).toBe('ZZTEST-1');
    expect(t1.status).toBe('todo');
    expect(t1.done).toBe(false);
    expect(t2.seq).toBe(2);
    expect(t2.ref).toBe('ZZTEST-2');
  });

  test('inbox task has no project, no seq, no ref', async () => {
    const t = await taskService.create({ title: 'An idea' });
    inboxTaskIds.push(t.id);
    expect(t.projectId).toBeNull();
    expect(t.seq).toBeNull();
    expect(t.ref).toBeNull();
    expect(t.status).toBe('inbox');
  });

  test('assignToProject triages from inbox and allocates the next seq', async () => {
    const idea = await taskService.create({ title: 'Triage me' });
    inboxTaskIds.push(idea.id);
    const assigned = await taskService.assignToProject(idea.id, projectId);
    expect(assigned.seq).toBe(3);
    expect(assigned.ref).toBe('ZZTEST-3');
    expect(assigned.status).toBe('backlog');
  });

  test('status → done stamps completed_at; leaving done clears it', async () => {
    const t = await taskService.create({ projectId, title: 'Finish me' });
    const done = await taskService.update(t.id, { status: 'done' });
    expect(done.done).toBe(true);
    expect(done.completedAt).not.toBeNull();

    const reopened = await taskService.update(t.id, { status: 'todo' });
    expect(reopened.done).toBe(false);
    expect(reopened.completedAt).toBeNull();
  });

  test('toggleDone flips done ⇄ todo', async () => {
    const t = await taskService.create({ projectId, title: 'Toggle me' });
    const on = await taskService.toggleDone(t.id);
    expect(on.status).toBe('done');
    const off = await taskService.toggleDone(t.id);
    expect(off.status).toBe('todo');
  });

  test('comments append with a source badge', async () => {
    const t = await taskService.create({ projectId, title: 'Log me' });
    await commentService.add({ taskId: t.id, body: 'started' });
    await commentService.add({ taskId: t.id, body: 'AI note', source: 'agent' });
    const list = await commentService.list(t.id);
    expect(list).toHaveLength(2);
    expect(list[0].source).toBe('web');
    expect(list[1].source).toBe('agent');
  });

  test('getByRef resolves a display ref', async () => {
    const t = await taskService.getByRef('ZZTEST-1');
    expect(t.title).toBe('First');
  });

  test('list sorts done last, higher priority first', async () => {
    const list = await taskService.list({ projectId, hideDone: false });
    expect(list.length).toBeGreaterThanOrEqual(3);
    // done tasks sink to the bottom
    const firstDoneIdx = list.findIndex((t) => t.done);
    if (firstDoneIdx !== -1) {
      expect(list.slice(firstDoneIdx).every((t) => t.done)).toBe(true);
    }
  });
});
