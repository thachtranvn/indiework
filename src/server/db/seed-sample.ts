/**
 * Sample / demo data for local development and demos. Run via `pnpm db:seed:sample`.
 *
 * RE-RUNNABLE: every run resets the four demo projects (DISK, SITE, API, MOBILE)
 * and the demo Inbox ideas, then rebuilds a rich data set that exercises:
 *   - all task statuses          (inbox, backlog, todo, in_progress, in_review, pending, done, cancelled)
 *   - all priorities             (none, low, medium, high, urgent)
 *   - 4 projects w/ varied status (active + pinned, active, paused)
 *   - DISK — a real product roadmap (Disk Advisor) mapped 1:1 from
 *     disk-cleanup/docs/product/ROADMAP.md: 9 phases → milestones, Swift
 *     packages → modules, every checklist item → a task at its true status
 *   - sub-tasks (checklist) with mixed completion
 *   - attachments (file + image metadata)
 *   - comments / timeline from every source (web, api, mcp, agent)
 *   - due dates (overdue, today, upcoming) and status notes ("what's blocking me")
 *
 * Your own (non-demo) Inbox tasks are left untouched. NOT used in production.
 */
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import {
  workspaceService,
  projectService,
  moduleService,
  milestoneService,
  taskService,
  attachmentService,
  commentService,
} from '@/server/services';
import type { CreateTaskInput } from '@/server/validators/task';

// ---- date helpers (relative to run time, so "overdue/today/soon" stay true) ----
const DAY = 86_400_000;
const now = new Date();
const days = (n: number) => new Date(now.getTime() + n * DAY);

// A task spec without the project wiring (filled in per project by `taskMaker`).
type DemoTask = Omit<CreateTaskInput, 'projectId' | 'parentId'>;

/** Bind a project id → a `T(spec)` helper that creates a task in that project. */
function taskMaker(projectId: string) {
  return (spec: DemoTask) => taskService.create({ projectId, ...spec });
}

// ---- reset helpers (make the seed idempotent / re-runnable) ----

async function resetProject(key: string): Promise<void> {
  const [p] = await db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(eq(schema.projects.key, key))
    .limit(1);
  if (p) {
    // FK cascades wipe modules, milestones, tasks, sub-tasks, attachments, comments.
    await db.delete(schema.projects).where(eq(schema.projects.id, p.id));
    console.info(`• reset existing demo project ${key}`);
  }
}

const INBOX_DEMO_TITLES = [
  'Add a dark-mode toggle to the navbar',
  'Tweet the launch thread the morning of',
  'Bug: sidebar flickers on first load',
  'Try the new Vercel AI Gateway for the assistant',
  'Refactor the date utils into one module',
];

async function resetDemoInbox(): Promise<void> {
  await db
    .delete(schema.tasks)
    .where(and(isNull(schema.tasks.projectId), inArray(schema.tasks.title, INBOX_DEMO_TITLES)));
}

async function ensureWorkspace(): Promise<string> {
  const existing = await workspaceService.getDefault();
  if (existing) return existing.id;
  const ws = await workspaceService.create({
    name: 'My Workspace',
    emoji: '◈',
    tagline: 'personal projects',
  });
  return ws.id;
}

// ---- project 0: DISK — Disk Advisor, mapped from the real product ROADMAP ----
// (disk-cleanup/docs/product/ROADMAP.md). The "hero" demo project: a Mac disk
// cleanup app mid-build at Phase 4, with phases 0–3 shipped.

async function seedDisk(workspaceId: string): Promise<void> {
  const { id: pid } = await projectService.create({
    workspaceId,
    key: 'DISK',
    name: 'Disk Advisor',
    emoji: '💽',
    color: '#5B8DEF',
    status: 'active',
    pinned: true,
    tags: ['Swift', 'SwiftUI', 'macOS'],
    shortDesc: 'Local-only Mac disk cleanup that explains what is safe to delete.',
    statusNote: 'Phase 4 (UI MVP) in flight — onboarding/FDA + Notes UI left.',
    description:
      '# Disk Advisor\n\nLocal-only macOS cleanup. Two iron rules:\n\n1. Losing a user file = stop shipping. No exceptions.\n2. No claim without a measurement.\n\nMapped from `docs/product/ROADMAP.md`.',
  });

  // sub-systems = the Swift packages from the roadmap
  const scan = (await moduleService.create({
    projectId: pid, name: 'DiskScanKit', color: '#5B8DEF', icon: 'layers', state: 'active',
    description: 'Scan engine: tree + top-N files, cancel, throttled progress.',
  })).id;
  const kb = (await moduleService.create({
    projectId: pid, name: 'KnowledgeKit', color: '#34BE9A', icon: 'folder', state: 'done',
    description: 'Regen-profile knowledge base + signed updates.',
  })).id;
  const advisor = (await moduleService.create({
    projectId: pid, name: 'AdvisorKit', color: '#A78BFA', icon: 'target', state: 'active',
    description: '4-level safety classification, ranking, and the Collector.',
  })).id;
  const action = (await moduleService.create({
    projectId: pid, name: 'ActionKit', color: '#F472B6', icon: 'lock', state: 'done',
    description: 'Safe deletion — one entry point, invariants INV-1…8.',
  })).id;
  const notes = (await moduleService.create({
    projectId: pid, name: 'NotesKit', color: '#FBBF24', icon: 'tag', state: 'active',
    description: 'User notes pinned to a path + safety labels.',
  })).id;
  const app = (await moduleService.create({
    projectId: pid, name: 'App UI', color: '#5B8DEF', icon: 'board', state: 'active',
    description: 'SwiftUI shell: scan-in-place, drill-down, Collector, Clean flow.',
  })).id;

  // 9 phases → milestones (0–3 done, 4 active, 5–8 planned)
  const ph0 = (await milestoneService.create({ projectId: pid, name: 'Phase 0 · Foundations', status: 'done', targetDate: days(-30) })).id;
  const ph1 = (await milestoneService.create({ projectId: pid, name: 'Phase 1 · Technical spikes', status: 'done', targetDate: days(-25) })).id;
  const ph2 = (await milestoneService.create({ projectId: pid, name: 'Phase 2 · Knowledge base', status: 'done', targetDate: days(-18) })).id;
  const ph3 = (await milestoneService.create({ projectId: pid, name: 'Phase 3 · Core engine', status: 'done', targetDate: days(-10) })).id;
  const ph4 = (await milestoneService.create({ projectId: pid, name: 'Phase 4 · UI MVP', status: 'active', targetDate: days(20) })).id;
  const ph5 = (await milestoneService.create({ projectId: pid, name: 'Phase 5 · Release prep', status: 'planned', targetDate: days(45) })).id;
  const ph6 = (await milestoneService.create({ projectId: pid, name: 'Phase 6 · Beta', status: 'planned', targetDate: days(75) })).id;
  const ph7 = (await milestoneService.create({ projectId: pid, name: 'Phase 7 · Launch 1.0', status: 'planned', targetDate: days(95) })).id;
  const ph8 = (await milestoneService.create({ projectId: pid, name: 'Phase 8 · P1', status: 'planned', targetDate: days(140) })).id;

  const T = taskMaker(pid);

  // -- Phase 0 (done) --
  await T({ title: 'Chốt 10 mục PENDING → tách ADR-0002…0005', status: 'done', priority: 'high', milestoneId: ph0 });
  await T({ title: 'Rà soát design handoff với PRD (design-scope-mvp)', status: 'done', priority: 'medium', moduleId: app, milestoneId: ph0 });
  await T({ title: 'Sửa PRD FR-I1 theo PD-5 (mạng chỉ update, opt-in)', status: 'done', priority: 'low', milestoneId: ph0 });
  await T({ title: 'Dựng skeleton repo apps/mac (4 Swift Package)', status: 'done', priority: 'high', milestoneId: ph0 });

  // -- Phase 1 — spikes (done), with checklist sub-tasks + measured results --
  const spike1 = await T({ title: 'Spike 1 — Benchmark tốc độ quét (getattrlistbulk)', status: 'done', priority: 'high', moduleId: scan, milestoneId: ph1 });
  await taskService.addSubtask(spike1.id, 'Verify khối lượng quét tương đương (file count + bytes)').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(spike1.id, 'Benchmark cold/warm ≥5 lần, lấy median').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(spike1.id, 'Kết luận PD-1 = A (Swift-only, ADR-0002)').then((s) => taskService.toggleDone(s.id));
  await commentService.add({ taskId: spike1.id, body: 'Warm: thắng dust 1.66–2.15×, ngang DaisyDisk. Cold: thắng dust 2.13×.', source: 'mcp' });

  const spike2 = await T({ title: 'Spike 2 — Đo dung lượng đúng trên APFS (alloc size)', status: 'done', priority: 'high', moduleId: scan, milestoneId: ph1 });
  await commentService.add({ taskId: spike2.id, body: 'Delta 0.00% so với du -k trên 3 cây thật + 7 fixture (sparse/clone/hardlink).', source: 'mcp' });
  await T({ title: 'Spike 3 — Full Disk Access probe + deep link', status: 'done', priority: 'medium', moduleId: app, milestoneId: ph1 });
  await T({ title: 'Spike 4 — Xóa an toàn (SafeDeleteKit, 9/9 invariant)', status: 'done', priority: 'high', moduleId: action, milestoneId: ph1 });

  // -- Phase 2 — knowledge base (done) --
  await T({ title: 'Thiết kế schema regen-profile (ADR-0004)', status: 'done', priority: 'high', moduleId: kb, milestoneId: ph2 });
  const kb1 = await T({ title: 'Biên soạn KB đợt 1 — 31 mục', status: 'done', priority: 'medium', moduleId: kb, milestoneId: ph2 });
  await commentService.add({ taskId: kb1.id, body: 'Coverage 95.2% bytes trên scan tươi (ngưỡng đặt trước ≥80%).', source: 'web' });
  await T({ title: 'Glob matcher + PathNormalizer (INV-6)', status: 'done', priority: 'medium', moduleId: kb, milestoneId: ph2 });
  await T({ title: 'Verify chữ ký KB update (Ed25519, INV-7)', status: 'done', priority: 'high', moduleId: kb, milestoneId: ph2 });
  await T({ title: 'CI validation KB (kb-tool validate, test phủ định)', status: 'done', priority: 'medium', moduleId: kb, milestoneId: ph2 });

  // -- Phase 3 — core engine (done) + the one item still blocked on the user --
  const scanProd = await T({ title: 'DiskScanKit: spike → production (ADR-0007)', status: 'done', priority: 'urgent', moduleId: scan, milestoneId: ph3 });
  await taskService.addSubtask(scanProd.id, 'Cancel token (quan sát ở ranh giới batch)').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(scanProd.id, 'Progress callback có throttle').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(scanProd.id, 'Bỏ ổ mạng / Time Machine (chặn theo st_dev)').then((s) => taskService.toggleDone(s.id));

  const advisorKit = await T({ title: 'AdvisorKit: phân loại 4 mức an toàn + ranking + Collector', status: 'done', priority: 'high', moduleId: advisor, milestoneId: ph3 });
  await commentService.add({ taskId: advisorKit.id, body: 'Rào cứng: 🟠🔴 không bao giờ tự vào Collector; nhãn user đè nhãn KB.', source: 'web' });
  await T({ title: 'NotesKit: user note theo path + nhãn (ADR-0006)', status: 'done', priority: 'high', moduleId: notes, milestoneId: ph3 });

  const actionKit = await T({ title: 'ActionKit: một entry point xóa duy nhất + invariants', status: 'done', priority: 'urgent', moduleId: action, milestoneId: ph3 });
  await taskService.addSubtask(actionKit.id, '🟢🟡 xóa thẳng · 🟠 qua Trash').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(actionKit.id, 'Recheck inode (TOCTOU), không follow symlink, không vượt mount').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(actionKit.id, 'Fault injection: file biến mất / EACCES / process khác giữ');

  await T({ title: 'CLI harness `da`: scan → advise → dry-run clean', status: 'done', priority: 'medium', moduleId: app, milestoneId: ph3 });

  const dogfood = await T({
    title: 'Dogfood `--execute` trên cache dev THẬT', status: 'pending', priority: 'urgent', moduleId: action, milestoneId: ph3,
    statusNote: 'Chờ bạn bật đèn xanh (Luật 1 — không tự xóa khi chưa được yêu cầu).', dueDate: days(-4),
  });
  await commentService.add({ taskId: dogfood.id, body: 'Đường xóa đã chứng minh an toàn (0 lần xóa nhầm trên cây throwaway). Đây là bước bạn tự chạy.', source: 'web' });

  // -- Phase 4 — UI MVP (active): M1 shipped, M2/M5/M6 in flight --
  const m1 = await T({ title: 'M1 — Lát cắt dọc đường hạnh phúc (DiskAdvisorCore)', status: 'done', priority: 'high', moduleId: app, milestoneId: ph4 });
  await commentService.add({ taskId: m1.id, body: '22 test Core xanh gồm test tích hợp xóa-thật trên cây tạm. App build sạch + boot không crash.', source: 'agent' });
  await T({ title: 'M1 — Trạng thái quét tại chỗ + thanh barber-pole (StripedScanBar)', status: 'done', priority: 'high', moduleId: app, milestoneId: ph4 });
  await T({ title: 'M1 — Danh sách xếp hạng + sort (Nặng nhất / A–Z / File lớn nhất)', status: 'done', priority: 'medium', moduleId: app, milestoneId: ph4 });
  await T({ title: 'M1 — Thẻ folder / panel Info (6 trường tái tạo FR-B3)', status: 'done', priority: 'medium', moduleId: app, milestoneId: ph4 });
  await T({ title: 'M1 — Collector: tổng GB luôn hiện + review trước khi Dọn', status: 'done', priority: 'medium', moduleId: advisor, milestoneId: ph4 });
  await T({ title: 'M1 — Luồng Dọn + màn kết quả ghi rõ "estimated"', status: 'done', priority: 'high', moduleId: app, milestoneId: ph4 });

  const m2 = await T({
    title: 'M2 — Onboarding + xin Full Disk Access (luồng F0)', status: 'in_progress', priority: 'high', moduleId: app, milestoneId: ph4, dueDate: days(6),
  });
  await commentService.add({ taskId: m2.id, body: 'Nhánh granted cần một .app ad-hoc-sign để TCC nhận diện; nhánh degraded chạy được từ swift run.', source: 'web' });
  await T({ title: 'Trạng thái phụ mỗi màn — còn degraded (chưa cấp quyền)', status: 'in_progress', priority: 'medium', moduleId: app, milestoneId: ph4 });
  await T({ title: 'M5 — User Note UI (viết note + đổi nhãn + màn Notes)', status: 'todo', priority: 'medium', moduleId: notes, milestoneId: ph4, dueDate: days(10) });
  await T({
    title: 'M6 — Universal binary (Intel + Apple Silicon)', status: 'todo', priority: 'low', moduleId: app, milestoneId: ph4,
    statusNote: 'Máy này là Intel → chỉ build universal được, chưa run-test trên AS (Luật 2).',
  });

  // -- Phase 5–8 (planned) → backlog --
  await T({ title: 'Developer ID signing + notarize + DMG tải trực tiếp', status: 'backlog', priority: 'high', milestoneId: ph5 });
  await T({ title: 'Sparkle update (opt-in)', status: 'backlog', priority: 'medium', milestoneId: ph5 });
  await T({ title: 'Trang landing tối thiểu + danh tính thật (FR-I6)', status: 'backlog', priority: 'low', moduleId: app, milestoneId: ph5 });
  await T({ title: 'Chốt tiêu chí dừng beta trước khi phát', status: 'backlog', priority: 'high', milestoneId: ph6 });
  await T({ title: 'Tuyển 10–20 dev beta (mix Intel/AS, ổ nhỏ/lớn)', status: 'backlog', priority: 'medium', milestoneId: ph6 });
  await T({ title: 'Chốt pricing: free / Pro mua một lần (Paddle/Lemon Squeezy)', status: 'backlog', priority: 'high', milestoneId: ph7 });
  await T({ title: 'Bài launch: Show HN · r/macapps · lobste.rs', status: 'backlog', priority: 'medium', milestoneId: ph7 });
  await T({ title: 'Lịch sử quét + so sánh (FR-E1/E2) + dựng persistence GRDB', status: 'backlog', priority: 'medium', milestoneId: ph8 });
  await T({ title: 'Số "đã giải phóng" thật + spike APFS purgeable (FR-G2b)', status: 'backlog', priority: 'low', moduleId: scan, milestoneId: ph8 });

  // -- a path not taken (cancelled) --
  const rustCore = await T({ title: 'PD-1 nhánh B — Rust core engine', status: 'cancelled', priority: 'none', moduleId: scan });
  await commentService.add({ taskId: rustCore.id, body: 'Không kích hoạt — Spike 1 đạt ngưỡng T0001, chốt Swift-only (ADR-0002).', source: 'web' });
}

// ---- project 1: SITE — a marketing site, active + pinned ----

async function seedSite(workspaceId: string): Promise<void> {
  const { id: pid } = await projectService.create({
    workspaceId,
    key: 'SITE',
    name: 'Landing site',
    emoji: '🚀',
    color: '#3FB984',
    status: 'active',
    pinned: true,
    tags: ['Next.js', 'Tailwind'],
    shortDesc: 'Marketing site + build-log for the launch.',
    statusNote: 'Hero + pricing left before we can ship v1.',
  });

  const core = (await moduleService.create({
    projectId: pid, name: 'Core UI', color: '#4C8DFF', icon: 'board', state: 'active',
    description: 'Hero, layout shell, and the design-token system.',
  })).id;
  const content = (await moduleService.create({
    projectId: pid, name: 'Content', color: '#34BE9A', icon: 'folder', state: 'planned',
    description: 'Copy, docs, and marketing pages.',
  })).id;
  const seo = (await moduleService.create({
    projectId: pid, name: 'SEO', color: '#A78BFA', icon: 'search', state: 'active',
    description: 'Meta tags, sitemap, and structured data.',
  })).id;

  const p1 = (await milestoneService.create({
    projectId: pid, name: 'Phase 1 · Foundations', status: 'done', targetDate: days(-20),
  })).id;
  const p2 = (await milestoneService.create({
    projectId: pid, name: 'Phase 2 · Launch', status: 'active', targetDate: days(25),
  })).id;

  const T = taskMaker(pid);

  const hero = await T({ title: 'Wire up the hero section', status: 'done', priority: 'high', moduleId: core, milestoneId: p1 });
  await commentService.add({ taskId: hero.id, body: 'Shipped the parallax variant — feels much more alive.', source: 'web' });

  await T({ title: 'Pick the type scale + design tokens', status: 'done', priority: 'medium', moduleId: core, milestoneId: p1 });

  const bento = await T({ title: 'Build the bento feature grid', status: 'in_progress', priority: 'high', moduleId: core, milestoneId: p2 });
  await taskService.addSubtask(bento.id, 'Sketch the bento layout').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(bento.id, 'Build the responsive grid cells').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(bento.id, 'Add hover + reveal interactions');
  await commentService.add({ taskId: bento.id, body: 'Generated 3 layout candidates — going with #2.', source: 'agent' });
  await commentService.add({ taskId: bento.id, body: 'Cells done, polishing the hover transitions now.', source: 'web' });

  const review = await T({ title: 'Review the hero animation timing', status: 'in_review', priority: 'medium', moduleId: core, milestoneId: p2 });
  await commentService.add({ taskId: review.id, body: 'PR up — easing curve tweaked to cubic-bezier(0.16, 1, 0.3, 1).', source: 'web' });

  const pricing = await T({
    title: 'Ship the pricing page', status: 'pending', priority: 'urgent', moduleId: core, milestoneId: p2,
    statusNote: 'Waiting on final pricing tiers from the spreadsheet.', dueDate: days(-3),
  });
  await attachmentService.add({ taskId: pricing.id, name: 'pricing-tiers.csv', type: 'file', size: '3.4 KB', ext: 'csv' });
  await attachmentService.add({ taskId: pricing.id, name: 'pricing-mock.png', type: 'image', size: '218 KB', ext: 'png' });
  await commentService.add({ taskId: pricing.id, body: 'Blocked until the tiers are confirmed.', source: 'web' });

  await T({ title: 'Add Open Graph + meta tags', status: 'todo', priority: 'high', moduleId: seo, milestoneId: p2, dueDate: days(0) });
  await T({ title: 'Write the launch build-log post', status: 'todo', priority: 'low', moduleId: content, milestoneId: p2, dueDate: days(5) });
  await T({ title: 'Draft the FAQ copy', status: 'backlog', priority: 'none', moduleId: content });

  const carousel = await T({ title: 'Drop the image carousel', status: 'cancelled', priority: 'low', moduleId: core });
  await commentService.add({ taskId: carousel.id, body: 'Cut — the bento grid replaces it.', source: 'web' });
}

// ---- project 2: API — a backend service, active ----

async function seedApi(workspaceId: string): Promise<void> {
  const { id: pid } = await projectService.create({
    workspaceId,
    key: 'API',
    name: 'Core API',
    emoji: '⚙️',
    color: '#4C8DFF',
    status: 'active',
    tags: ['Node', 'Drizzle', 'Postgres'],
    shortDesc: 'The REST + MCP backend behind every client.',
    statusNote: 'Auth + rate-limiting in flight; billing is blocked.',
  });

  const auth = (await moduleService.create({
    projectId: pid, name: 'Auth', color: '#F472B6', icon: 'lock', state: 'active',
    description: 'Login, sessions, and tokens.',
  })).id;
  const tasksApi = (await moduleService.create({
    projectId: pid, name: 'Tasks API', color: '#4C8DFF', icon: 'bolt', state: 'active',
    description: 'CRUD + query endpoints.',
  })).id;
  const billing = (await moduleService.create({
    projectId: pid, name: 'Billing', color: '#FBBF24', icon: 'key', state: 'planned',
    description: 'Stripe integration.',
  })).id;

  const v1 = (await milestoneService.create({
    projectId: pid, name: 'v1 · Public API', status: 'active', targetDate: days(15),
  })).id;
  const v2 = (await milestoneService.create({
    projectId: pid, name: 'v2 · Webhooks', status: 'planned', targetDate: days(60),
  })).id;

  const T = taskMaker(pid);

  const schemaTask = await T({ title: 'Design DB schema + migrations', status: 'done', priority: 'high', moduleId: auth, milestoneId: v1 });
  await taskService.addSubtask(schemaTask.id, 'Draft the ERD').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(schemaTask.id, 'Write the Drizzle schema').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(schemaTask.id, 'Generate migrations').then((s) => taskService.toggleDone(s.id));
  await commentService.add({ taskId: schemaTask.id, body: 'Schema validated against scope.md §2.', source: 'mcp' });

  const jwt = await T({ title: 'Add JWT refresh tokens', status: 'in_progress', priority: 'high', moduleId: auth, milestoneId: v1 });
  await commentService.add({ taskId: jwt.id, body: 'Endpoint scaffolded via the CLI.', source: 'api' });
  await commentService.add({ taskId: jwt.id, body: 'Added rotation + a revoke list.', source: 'agent' });

  const rate = await T({ title: 'Rate-limiting middleware', status: 'in_review', priority: 'high', moduleId: tasksApi, milestoneId: v1 });
  await commentService.add({ taskId: rate.id, body: 'Reviewing the token-bucket implementation.', source: 'web' });

  const stripe = await T({
    title: 'Wire up Stripe webhooks', status: 'pending', priority: 'urgent', moduleId: billing, milestoneId: v2,
    statusNote: 'Blocked on Stripe test keys from finance.', dueDate: days(-1),
  });
  await commentService.add({ taskId: stripe.id, body: 'Got a 401 from Stripe — test keys are still missing.', source: 'api' });

  await T({ title: 'Add pagination to list endpoints', status: 'todo', priority: 'medium', moduleId: tasksApi, milestoneId: v1, dueDate: days(4) });
  await T({ title: 'Explore a GraphQL gateway', status: 'backlog', priority: 'low', moduleId: tasksApi });
  await T({ title: 'Write the API reference docs', status: 'todo', priority: 'low', moduleId: auth });

  const mongo = await T({ title: 'Migrate to MongoDB', status: 'cancelled', priority: 'none', moduleId: tasksApi });
  await commentService.add({ taskId: mongo.id, body: 'Cancelled — Postgres + Drizzle is working great.', source: 'web' });
}

// ---- project 3: MOBILE — a companion app, paused ----

async function seedMobile(workspaceId: string): Promise<void> {
  const { id: pid } = await projectService.create({
    workspaceId,
    key: 'MOBILE',
    name: 'Mobile app',
    emoji: '📱',
    color: '#F4A340',
    status: 'paused',
    tags: ['Expo', 'React Native'],
    shortDesc: 'Offline-first companion app for iOS + Android.',
    statusNote: 'Paused — waiting on the Apple Developer account.',
  });

  const onboarding = (await moduleService.create({
    projectId: pid, name: 'Onboarding', color: '#34BE9A', icon: 'sparkle', state: 'active',
    description: 'Sign-up + first-run flow.',
  })).id;
  const sync = (await moduleService.create({
    projectId: pid, name: 'Sync', color: '#4C8DFF', icon: 'layers', state: 'active',
    description: 'Offline-first sync engine.',
  })).id;
  const notifications = (await moduleService.create({
    projectId: pid, name: 'Notifications', color: '#F472B6', icon: 'bolt', state: 'planned',
    description: 'Push + in-app alerts.',
  })).id;

  const mvp = (await milestoneService.create({
    projectId: pid, name: 'MVP', status: 'active', targetDate: days(40),
  })).id;
  await milestoneService.create({ projectId: pid, name: 'Beta', status: 'planned', targetDate: days(90) });

  const T = taskMaker(pid);

  const push = await T({
    title: 'Set up push notifications', status: 'pending', priority: 'high', moduleId: notifications, milestoneId: mvp,
    statusNote: 'Paused: waiting on Apple Developer account approval.', dueDate: days(-7),
  });
  await commentService.add({ taskId: push.id, body: 'On hold until the developer account clears.', source: 'web' });

  const offline = await T({ title: 'Build the offline sync engine', status: 'in_progress', priority: 'urgent', moduleId: sync, milestoneId: mvp });
  await taskService.addSubtask(offline.id, 'Local SQLite store').then((s) => taskService.toggleDone(s.id));
  await taskService.addSubtask(offline.id, 'Conflict resolution');
  await taskService.addSubtask(offline.id, 'Background sync queue');
  await commentService.add({ taskId: offline.id, body: 'Drafted a last-write-wins strategy for v1.', source: 'agent' });

  const authFlow = await T({ title: 'Auth flow screens', status: 'in_review', priority: 'medium', moduleId: onboarding, milestoneId: mvp });
  await commentService.add({ taskId: authFlow.id, body: 'Design review in progress.', source: 'web' });

  await T({ title: 'Onboarding carousel', status: 'todo', priority: 'medium', moduleId: onboarding, milestoneId: mvp, dueDate: days(8) });

  const scaffold = await T({ title: 'Expo project scaffold + CI', status: 'done', priority: 'high', moduleId: onboarding });
  await commentService.add({ taskId: scaffold.id, body: 'CI green on the first run.', source: 'mcp' });

  await T({ title: 'Tablet / large-screen layout', status: 'backlog', priority: 'low', moduleId: sync });
  await T({ title: 'Dark mode', status: 'backlog', priority: 'none', moduleId: notifications });

  const widget = await T({ title: 'Android home-screen widget', status: 'cancelled', priority: 'low', moduleId: onboarding });
  await commentService.add({ taskId: widget.id, body: 'Cut from MVP scope.', source: 'web' });
}

// ---- untriaged Inbox ideas (no project, status `inbox`) ----

async function seedInbox(): Promise<void> {
  await taskService.create({ title: 'Add a dark-mode toggle to the navbar', priority: 'medium' });
  await taskService.create({ title: 'Tweet the launch thread the morning of', priority: 'low' });
  await taskService.create({ title: 'Bug: sidebar flickers on first load', priority: 'high' });
  await taskService.create({ title: 'Try the new Vercel AI Gateway for the assistant', priority: 'none' });
  await taskService.create({ title: 'Refactor the date utils into one module', priority: 'low' });
}

async function main() {
  const workspaceId = await ensureWorkspace();

  await resetProject('DISK');
  await resetProject('SITE');
  await resetProject('API');
  await resetProject('MOBILE');
  await resetDemoInbox();

  await seedDisk(workspaceId);
  await seedSite(workspaceId);
  await seedApi(workspaceId);
  await seedMobile(workspaceId);
  await seedInbox();

  console.info('✓ seeded 4 demo projects (DISK, SITE, API, MOBILE) + Inbox — all task states covered');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ sample seed failed:', err);
    process.exit(1);
  });
