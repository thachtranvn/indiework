/* ============================================================
   Sample data — modeled from the "Disk Advisor" roadmap.
   One solo dev. Two projects, modules (sub-systems),
   milestones (phases), tasks, status notes & activity.
   ============================================================ */

const STATUSES = [
  { id: "inbox",       label: "Inbox",       key: "inbox" },
  { id: "backlog",     label: "Backlog",     key: "backlog" },
  { id: "todo",        label: "Todo",        key: "todo" },
  { id: "in_progress", label: "In progress", key: "in_progress" },
  { id: "blocked",     label: "Blocked",     key: "blocked" },
  { id: "done",        label: "Done",        key: "done" },
  { id: "cancelled",   label: "Cancelled",   key: "cancelled" },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]));
const BOARD_COLUMNS = ["backlog", "todo", "in_progress", "blocked", "done"];

const PRIORITIES = [
  { id: "none",   label: "None",   rank: 0, key: "none" },
  { id: "low",    label: "Low",    rank: 1, key: "low" },
  { id: "medium", label: "Medium", rank: 2, key: "medium" },
  { id: "high",   label: "High",   rank: 3, key: "high" },
  { id: "urgent", label: "Urgent", rank: 4, key: "urgent" },
];
const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map(p => [p.id, p]));

/* ---- workspaces (top-level containers; a solo dev may keep a few) ---- */
const WORKSPACES = [
  { id: "ws-solo",   name: "Solo Dev",     emoji: "\u25C8", tagline: "personal projects" },
  { id: "ws-client", name: "Client Work",  emoji: "\uD83D\uDCBC", tagline: "billable, contracts" },
  { id: "ws-lab",    name: "Side Lab",     emoji: "\uD83E\uDDEA", tagline: "experiments & toys" },
];

/* ---- API keys (App Settings) ---- */
const API_KEYS = [
  { id: "ak1", name: "Local CLI",        prefix: "wb_live_", tail: "9fA2", scope: "read-write", created: "2026-05-02", lastUsed: "2026-06-13" },
  { id: "ak2", name: "Capture shortcut", prefix: "wb_live_", tail: "k7Lq", scope: "write",      created: "2026-04-18", lastUsed: "2026-06-12" },
  { id: "ak3", name: "Status webhook",   prefix: "wb_live_", tail: "Zr30", scope: "read",       created: "2026-03-27", lastUsed: "2026-05-30" },
];

/* ---- project status (lifecycle of a whole project) ---- */
const PROJECT_STATUSES = [
  { id: "active",    label: "In progress", key: "in_progress" },
  { id: "planned",   label: "Planned",     key: "todo" },
  { id: "paused",    label: "Paused",      key: "blocked" },
  { id: "done",      label: "Completed",   key: "done" },
  { id: "backlog",   label: "Backlog",     key: "backlog" },
  { id: "cancelled", label: "Cancelled",   key: "cancelled" },
];
const PROJECT_STATUS_MAP = Object.fromEntries(PROJECT_STATUSES.map(s => [s.id, s]));

/* ---- projects ---- */
/* Two are pinned; the rest fan out across lifecycle statuses for the sidebar + table groupings. */
const PROJECTS = [
  { id: "disk", key: "DISK", name: "Disk Advisor", emoji: "\uD83E\uDDF9", color: "#3FB984", pinned: true,
    status: "active", tags: ["Swift", "macOS", "SwiftPM"], issues: 18,
    shortDesc: "Mac app that finds safe-to-delete disk space and explains why.",
    statusNote: "Phase 2 \u2014 Knowledge Base. Half of Gate 2 still open: real coverage on a fresh scan (waiting to run it).",
    description: "## What it is\nA native macOS app that scans your disk, ranks the heaviest reclaimable caches, and tells you **exactly why** each item is safe to delete.\n\n## Why\nEvery cleaner on the market is either a scary catch-all or a glorified `rm -rf`. Disk Advisor leads with *knowledge*, not aggression.\n\n- Honest progress, no fake percentages\n- Regen-profile knowledge base, signed updates\n- `SafeDeleteKit` with 9 hard invariants" },
  { id: "aurora", key: "AUR", name: "Aurora API", emoji: "\uD83D\uDE80", color: "#A06BF0", pinned: true,
    status: "active", tags: ["Go", "PostgreSQL", "Redis", "gRPC"], issues: 11,
    shortDesc: "Multi-tenant backend platform powering the rest of the suite.",
    statusNote: "v0.4 \u2014 auth + billing stable. Rate-limiter rewrite in flight.",
    description: "## Aurora API\nThe shared backbone: auth, billing, webhooks, and a typed gRPC gateway.\n\n```\nclient \u2192 edge \u2192 aurora-gateway \u2192 services\n```\n\nDesigned to be boring, observable, and hard to take down." },
  { id: "pocket", key: "PCK", name: "Pocket Ledger", emoji: "\uD83D\uDCD2", color: "#34BE9A", pinned: false,
    status: "active", tags: ["SwiftUI", "CoreData", "CloudKit"], issues: 7,
    shortDesc: "Offline-first personal finance tracker with envelope budgeting.",
    statusNote: "Sync conflict resolution is the last blocker before TestFlight.",
    description: "## Pocket Ledger\nEnvelope budgeting that works on a plane. CloudKit sync, no servers, no subscriptions." },
  { id: "mailwright", key: "MAIL", name: "Mailwright", emoji: "\u2709\uFE0F", color: "#4C8DFF", pinned: false,
    status: "active", tags: ["NextJS", "Tailwind", "Prisma"], issues: 14,
    shortDesc: "Drag-and-drop email campaign builder for indie makers.",
    statusNote: "Template editor MVP done. Deliverability tooling next.",
    description: "## Mailwright\nCompose, segment, send. A campaign tool that doesn't need a sales call to set up." },
  { id: "quill", key: "QUILL", name: "Quill Notes", emoji: "\uD83E\uDEB6", color: "#E8A33D", pinned: false,
    status: "active", tags: ["Electron", "React", "SQLite"], issues: 9,
    shortDesc: "Local-first markdown notes with bidirectional links.",
    statusNote: "Graph view shipped. Working on plugin API.",
    description: "## Quill Notes\nPlain-text markdown, stored locally, linked like a wiki." },
  { id: "cobalt", key: "COB", name: "Cobalt", emoji: "\u2699\uFE0F", color: "#6E8BFF", pinned: false,
    status: "active", tags: ["TypeScript", "Node", "Style Dictionary"], issues: 5,
    shortDesc: "Design-token manager that syncs Figma variables to code.",
    statusNote: "Figma plugin in review. CLI export is stable.",
    description: "## Cobalt\nOne source of truth for design tokens \u2014 Figma in, CSS / Swift / Kotlin out." },
  { id: "atlas", key: "ATL", name: "Atlas Docs", emoji: "\uD83D\uDCDA", color: "#E06CA8", pinned: false,
    status: "active", tags: ["NextJS", "MDX", "Algolia"], issues: 8,
    shortDesc: "Docs framework with versioning and instant search baked in.",
    statusNote: "Versioned routing works. Polishing the search UX.",
    description: "## Atlas Docs\nDocumentation that scales with your product: versioned, searchable, themeable." },
  { id: "site", key: "SITE", name: "Personal Site", emoji: "\uD83E\uDEB4", color: "#6E8BFF", pinned: false,
    status: "planned", tags: ["Astro", "HTML", "CSS"], issues: 2,
    shortDesc: "Portfolio and build-log, picking back up after Disk Advisor 1.0.",
    statusNote: "Idle. Picking back up after Disk Advisor 1.0 ships.",
    description: "## Personal Site\nA portfolio plus a build-log. The APFS size-measurement story is good material." },
  { id: "glyph", key: "GLY", name: "Glyph", emoji: "\u2728", color: "#A06BF0", pinned: false,
    status: "planned", tags: ["Svelte", "TypeScript", "SVG"], issues: 4,
    shortDesc: "Open-source icon set with a searchable browsing site.",
    statusNote: "Drawing the first 200 glyphs before building the site.",
    description: "## Glyph\nA consistent, hand-tuned 1.6px-stroke icon set \u2014 free, forever." },
  { id: "harbor", key: "HBR", name: "Harbor", emoji: "\uD83D\uDEA2", color: "#4C8DFF", pinned: false,
    status: "planned", tags: ["Go", "React", "Docker"], issues: 6,
    shortDesc: "Lightweight dashboard for self-hosted Docker containers.",
    statusNote: "Spec'd. Waiting on Aurora's auth module to land.",
    description: "## Harbor\nA calm dashboard for the handful of containers on your home server." },
  { id: "verdant", key: "VRD", name: "Verdant", emoji: "\uD83C\uDF31", color: "#34BE9A", pinned: false,
    status: "planned", tags: ["SwiftUI", "WidgetKit"], issues: 3,
    shortDesc: "Plant-care reminders with a Home Screen widget.",
    statusNote: "Concept + moodboard. Not started.",
    description: "## Verdant\nWater the right plant on the right day. A small, quiet app." },
  { id: "lumen", key: "LUM", name: "Lumen", emoji: "\uD83D\uDCA1", color: "#E8A33D", pinned: false,
    status: "planned", tags: ["TypeScript", "DuckDB", "Vite"], issues: 5,
    shortDesc: "Privacy-first, single-binary web analytics.",
    statusNote: "Evaluating DuckDB-WASM for the query layer.",
    description: "## Lumen\nAnalytics you can self-host in one binary. No cookies, no creep." },
  { id: "streak", key: "STK", name: "Streak", emoji: "\uD83D\uDD25", color: "#F0685E", pinned: false,
    status: "paused", tags: ["React Native", "Expo"], issues: 12,
    shortDesc: "Habit tracker with a no-guilt, miss-a-day-is-fine philosophy.",
    statusNote: "Paused \u2014 Expo SDK upgrade broke notifications. Revisit later.",
    description: "## Streak\nBuild habits without the shame spiral. Missing a day is part of the plan." },
  { id: "tempo", key: "TMP", name: "Tempo", emoji: "\u23F1\uFE0F", color: "#6B86A3", pinned: false,
    status: "paused", tags: ["Vue", "Firebase"], issues: 6,
    shortDesc: "Time tracking that infers entries from your calendar.",
    statusNote: "Paused \u2014 Firebase costs got scary at scale. Rethinking backend.",
    description: "## Tempo\nStop starting timers. Tempo guesses what you worked on and asks you to confirm." },
  { id: "ferry", key: "FRY", name: "Ferry", emoji: "\uD83D\uDEF6", color: "#A06BF0", pinned: false,
    status: "paused", tags: ["Rust", "WebRTC"], issues: 4,
    shortDesc: "Peer-to-peer file transfer with no size limits.",
    statusNote: "Paused \u2014 NAT traversal is harder than the fun part.",
    description: "## Ferry\nDrag a file, share a link, transfer directly device-to-device." },
  { id: "beacon", key: "BCN", name: "Beacon", emoji: "\uD83D\uDCE1", color: "#34BE9A", pinned: false,
    status: "done", tags: ["NextJS", "Vercel"], issues: 0,
    shortDesc: "Dead-simple public status page for small services.",
    statusNote: "Shipped v1. Running quietly in production.",
    description: "## Beacon\nA status page you can stand up in five minutes. Incidents, uptime, subscribe." },
  { id: "relay", key: "RLY", name: "Relay", emoji: "\uD83D\uDD01", color: "#4C8DFF", pinned: false,
    status: "done", tags: ["Go", "NATS"], issues: 1,
    shortDesc: "Webhook router that fans out, retries, and replays.",
    statusNote: "Done \u2014 folded into Aurora as the webhook service.",
    description: "## Relay\nReceive once, deliver everywhere, with retries and a replay log." },
  { id: "cinder", key: "CDR", name: "Cinder", emoji: "\uD83E\uDDCA", color: "#F0685E", pinned: false,
    status: "backlog", tags: ["Rust"], issues: 0,
    shortDesc: "Blazing static-site generator with zero config.",
    statusNote: "Backlog \u2014 maybe folds into Personal Site instead.",
    description: "## Cinder\nMarkdown in, fast static site out. No config, no plugins to wire up." },
  { id: "sift", key: "SFT", name: "Sift", emoji: "\uD83D\uDD0D", color: "#6B86A3", pinned: false,
    status: "backlog", tags: ["Rust", "ClickHouse"], issues: 0,
    shortDesc: "Grep-fast log search for a single beefy box.",
    statusNote: "Backlog \u2014 idea only.",
    description: "## Sift\nFull-text log search that doesn't need a cluster to feel instant." },
  { id: "pageturn", key: "PGT", name: "Pageturn", emoji: "\uD83D\uDCD6", color: "#E06CA8", pinned: false,
    status: "cancelled", tags: ["Flutter", "Dart"], issues: 0,
    shortDesc: "Cross-platform ebook reader with sync.",
    statusNote: "Cancelled \u2014 the market is saturated and DRM is a nightmare.",
    description: "## Pageturn\nA clean ebook reader. Shelved \u2014 not worth fighting the DRM ecosystem." },
];

/* ---- modules (sub-systems) ---- */
const MODULES = [
  { id: "scan",    projectId: "disk", name: "DiskScanKit",  color: "#4C8DFF" },
  { id: "advisor", projectId: "disk", name: "AdvisorKit",   color: "#A06BF0" },
  { id: "action",  projectId: "disk", name: "ActionKit",    color: "#F0685E" },
  { id: "kb",      projectId: "disk", name: "KnowledgeKit", color: "#34BE9A" },
  { id: "ui",      projectId: "disk", name: "App & UI",     color: "#E8A33D" },
  { id: "infra",   projectId: "disk", name: "Infra / CI",   color: "#6B86A3" },
  { id: "dist",    projectId: "disk", name: "Distribution", color: "#E06CA8" },
  { id: "site-build", projectId: "site", name: "Build",     color: "#6E8BFF" },
  { id: "site-content", projectId: "site", name: "Content", color: "#34BE9A" },
];
const MODULE_MAP = Object.fromEntries(MODULES.map(m => [m.id, m]));

/* ---- milestones (phases) ---- */
const MILESTONES = [
  { id: "p0", projectId: "disk", name: "Phase 0 · Foundations",     date: "2026-06-08", state: "done" },
  { id: "p1", projectId: "disk", name: "Phase 1 · Risk spikes",     date: "2026-06-13", state: "done" },
  { id: "p2", projectId: "disk", name: "Phase 2 · Knowledge base",  date: "2026-06-30", state: "active" },
  { id: "p3", projectId: "disk", name: "Phase 3 · Core engine",     date: "2026-07-28", state: "active" },
  { id: "p4", projectId: "disk", name: "Phase 4 · UI MVP",          date: "2026-08-25", state: "planned" },
  { id: "p5", projectId: "disk", name: "Phase 5 · Release polish",  date: "2026-09-08", state: "planned" },
  { id: "p6", projectId: "disk", name: "Phase 6 · Beta",            date: "2026-10-06", state: "planned" },
  { id: "p7", projectId: "disk", name: "Phase 7 · Launch 1.0",      date: "2026-10-20", state: "planned" },
  { id: "site-v1", projectId: "site", name: "v1 · Online",          date: "2026-11-15", state: "planned" },
];
const MILESTONE_MAP = Object.fromEntries(MILESTONES.map(m => [m.id, m]));

/* helper to keep task authoring terse */
let _seq = {};
function ref(projKey) { _seq[projKey] = (_seq[projKey] || 0) + 1; return _seq[projKey]; }

function cm(day, body, source = "web") { return { day, body, source }; }

/* ---- tasks ---- */
const TASKS = [
  /* ---------- Phase 0 (done) ---------- */
  { p: "disk", title: "Lock the 10 PENDING decisions into ADRs", status: "done", pr: "low",
    mod: "infra", ms: "p0", due: "2026-06-13", done: true,
    desc: "Review & close all 10 items in PENDING.md → split an ADR per resolved item (ADR-0002…0005). PD-10 (distribution) deferred, doesn't touch P0.",
    activity: [cm("6/13", "Closed. PD-10 parked — out of P0 scope.")] },
  { p: "disk", title: "Reconcile design handoff against current PRD", status: "done", pr: "medium",
    mod: "ui", ms: "p0", done: true,
    note: "Handoff was stale in 3 places — all reconciled into design-scope-mvp.md.",
    desc: "Handoff lagged the PRD: C1 cut (no goal prompt), G2b pushed to P1, 'recommend KEEP' note not in MVP. Produced design-scope-mvp.md mapping every screen/state to an FR.",
    activity: [cm("6/11", "Found whole AI layer is P2; sunburst map, Uninstall, Trash cooling-off all P1.", "agent")] },
  { p: "disk", title: "Stand up skeleton repo (4 Swift packages + thin app)", status: "done", pr: "medium",
    mod: "infra", ms: "p0", done: true,
    desc: "apps/mac per ADR-0003. Build + test green locally (7 tests pass, app shell links). CI workflow added.",
    activity: [cm("6/13", "Green locally. CI runs on push — not yet observed on cloud.")] },

  /* ---------- Phase 1 (done) ---------- */
  { p: "disk", title: "Spike 1 — Scan-speed benchmark vs dust & DaisyDisk", status: "done", pr: "high",
    mod: "scan", ms: "p1", done: true,
    note: "Warm: beat dust 1.66–2.15×, on par with DaisyDisk. PD-1 = A, locked in ADR-0002.",
    desc: "Swift CLI prototype using getattrlistbulk. Verified equal scan volume (file count + bytes) before timing. Benchmark method per KNOWHOW: cold/warm, ≥5 runs, median.",
    activity: [
      cm("6/12", "File count matches exactly on both trees; bytes differ ≤0.77%."),
      cm("6/13", "Warm 40.5s vs ~40s DaisyDisk. Cold 13.1s vs 28.0s dust (2.13×). Conclusion meets pre-set T0001 criteria.", "api"),
    ] },
  { p: "disk", title: "Spike 2 — Correct on-disk size on APFS", status: "done", pr: "high",
    mod: "scan", ms: "p1", done: true,
    desc: "Sum ATTR_FILE_ALLOCSIZE, dedup hardlinks by (dev,inode), skip firmlinks, compare du -k. Delta 0.00% across 3 real trees + 7 fixtures (sparse/clone/hardlink).",
    activity: [cm("6/13", "delta 0.00% vs du -k, well under the ≤2% pre-set threshold. Clone-dedup df-based deferred to P1.")] },
  { p: "disk", title: "Spike 3 — Full Disk Access probe & deep-link map", status: "done", pr: "medium",
    mod: "scan", ms: "p1", done: true,
    desc: "Probe Safari/Mail/Messages (TCC.db is a poor probe) + deep link + target map. Measured both branches.",
    activity: [cm("6/13", "From Terminal w/o FDA: Mail/Messages/Safari DENIED, dev caches OK → core P0 runs without FDA. FDA is an affordance, not a gate.", "agent")] },
  { p: "disk", title: "Spike 4 — Safe-deletion invariants (SafeDeleteKit)", status: "done", pr: "high",
    mod: "action", ms: "p1", done: true,
    desc: "SafeDeleteKit + CLI. 9/9 invariant tests green, dry-run plan correct: no symlink follow, no mount crossing, TOCTOU inode recheck, guard blocks paths outside sandbox.",
    activity: [cm("6/13", "Held-file + real-mount measurement via --execute waits for green light (Rule 1).")] },

  /* ---------- Phase 2 (active) ---------- */
  { p: "disk", title: "Design regen-profile schema (KnowledgeEntry)", status: "done", pr: "medium",
    mod: "kb", ms: "p2", done: true,
    desc: "Per ADR-0004 verbatim: friction required, canFail optional, regenHow/safety/source are closed enum vocabularies. schemaVersion + contentVersion at file level.",
    activity: [] },
  { p: "disk", title: "Author KB batch 1 — 26 entries", status: "done", pr: "medium",
    mod: "kb", ms: "p2", done: true,
    desc: "Xcode (DerivedData, DeviceSupport, CoreSimulator, Archives), JS (node_modules, npm/yarn/pnpm, pip), Docker, Gradle, Maven, Cargo, Go, CocoaPods, Homebrew, Android AVD, HF/Ollama models, system caches.",
    activity: [cm("6/12", "Trash removed from KB — doesn't fit the regen-profile model. ActionKit/UI handle it separately.")] },
  { p: "disk", title: "Glob matcher + PathNormalizer", status: "done", pr: "low",
    mod: "kb", ms: "p2", done: true,
    desc: "`**/node_modules`, `~/Library/...`, case-insensitive on APFS, most-specific match wins. PathNormalizer strips usernames (INV-6). Tested.",
    activity: [] },
  { p: "disk", title: "KB update signature verify (Ed25519)", status: "done", pr: "medium",
    mod: "kb", ms: "p2", done: true,
    desc: "Client KBUpdateVerifier verifies before decode (INV-7). Sign/byte-flip/wrong-key tests green. Production CDN + public key deferred to Phase 5.",
    activity: [] },
  { p: "disk", title: "Measure KB coverage ≥80% on a FRESH scan", status: "blocked", pr: "urgent",
    mod: "kb", ms: "p2", done: false,
    note: "BLOCKED: need an independent fresh `du` list to measure real coverage — can't self-scan the disk without your go-ahead. Tool + criteria are ready.",
    desc: "Pre-set gate criterion (not adjustable after the fact). Run `kb-tool coverage <du.tsv>` on a du list independent of the KNOWHOW table. Self-coverage of 99.0% is only a regression guard, NOT the real measurement.",
    activity: [
      cm("6/13", "Self-coverage 99.0% against the KNOWHOW table — regression guard only, not an independent measure.", "agent"),
      cm("6/13", "Real fresh-scan coverage will likely be lower (unmapped JetBrains/VS Code caches, stray ~/Library/Caches children). That's signal to add entries with real knowledge — not a blanket catch-all."),
    ] },
  { p: "disk", title: "CI gate: reject malformed KB entries", status: "done", pr: "medium",
    mod: "infra", ms: "p2", done: true,
    desc: "KnowledgeBaseValidator + `kb-tool validate` CI step. Proven by negative tests: empty field / unknown enum / duplicate id all rejected (INV-1/2/5/8).",
    activity: [] },

  /* ---------- Phase 3 (todo / in progress) ---------- */
  { p: "disk", title: "DiskScanKit: spike → production", status: "in_progress", pr: "high",
    mod: "scan", ms: "p3", done: false,
    note: "Wiring cancel/resume + progress reporting. RAM cap on huge trees next.",
    desc: "Cancel/resume, progress to UI, RAM limit on large trees (FR-I5), skip network drives / Time Machine.",
    activity: [cm("6/13", "Started from the Spike-1 CLI core. Cancel token in; resume cursor sketched.")] },
  { p: "disk", title: "AdvisorKit: 4-level safety classification + ranking", status: "todo", pr: "high",
    mod: "advisor", ms: "p3", done: false,
    desc: "Classify 4 safety levels (FR-B5), rank by size (FR-C2), hard rule '🟠🔴 never pre-selected', Collector state (FR-G4), largest-files mode (FR-A3).",
    activity: [] },
  { p: "disk", title: "ActionKit: single deletion entry point", status: "todo", pr: "urgent",
    mod: "action", ms: "p3", done: false,
    note: "Most important module, heaviest tests. Rule 1: losing a user's file = stop shipping.",
    desc: "One delete entry point taking the exact list the user saw. 🟢🟡 delete direct; 🟠 via Trash; two override settings per FR-G2. Full spec in docs/specs/deletion.md.",
    activity: [] },
  { p: "disk", title: "ActionKit: invariant test suite (INV 1–8)", status: "todo", pr: "urgent",
    mod: "action", ms: "p3", done: false,
    desc: "No symlink follow, no mount crossing, TOCTOU inode recheck, never touch a path outside the list, Trash sweep only touches files we moved there.",
    activity: [] },
  { p: "disk", title: "ActionKit: fault-injection tests", status: "todo", pr: "high",
    mod: "action", ms: "p3", done: false,
    desc: "File vanishes mid-op, permission lost, disk full, another process holding the file.",
    activity: [] },
  { p: "disk", title: "CLI harness: full scan → advise → dry-run clean", status: "todo", pr: "medium",
    mod: "infra", ms: "p3", done: false,
    desc: "Dogfood on this machine, replacing the old cli/ tool. Core coverage ≥80%, golden fixture trees.",
    activity: [] },

  /* ---------- Phase 4 (todo / backlog) ---------- */
  { p: "disk", title: "Onboarding + Full Disk Access request flow", status: "todo", pr: "medium",
    mod: "ui", ms: "p4", done: false,
    desc: "Flow F0. Explain before asking; run partially when not yet granted (PRD open question #2).",
    activity: [] },
  { p: "disk", title: "Scan screen with honest progress bar", status: "backlog", pr: "low",
    mod: "ui", ms: "p4", done: false,
    desc: "Truthful progress (FR-A1). No fake percentages.", activity: [] },
  { p: "disk", title: "Ranked list + sort control (Heaviest · A–Z · Largest files)", status: "backlog", pr: "medium",
    mod: "ui", ms: "p4", done: false, desc: "FR-A3, C2.", activity: [] },
  { p: "disk", title: "Collector: running GB total + review-before-clean", status: "backlog", pr: "medium",
    mod: "ui", ms: "p4", done: false, desc: "Total always visible, add/remove items, review before Clean (FR-G1, G4).", activity: [] },

  /* ---------- Phase 5+ (backlog) ---------- */
  { p: "disk", title: "Developer ID signing + notarize, direct DMG", status: "backlog", pr: "low",
    mod: "dist", ms: "p5", done: false, desc: "PD-10.", activity: [] },
  { p: "disk", title: "Sparkle auto-update, opt-in", status: "backlog", pr: "low",
    mod: "dist", ms: "p5", done: false, desc: "PD-5 / PD-10.", activity: [] },
  { p: "disk", title: "Recruit 10–20 beta devs (mix Intel/AS, small/large disks)", status: "backlog", pr: "low",
    mod: null, ms: "p6", done: false, desc: "Friends, colleagues, r/macapps DM.", activity: [] },
  { p: "disk", title: "Pricing: free (scan+explain) / Pro one-time", status: "backlog", pr: "low",
    mod: "dist", ms: "p7", done: false, desc: "Integrate Paddle or Lemon Squeezy (PD-10).", activity: [] },
  { p: "disk", title: "Show HN launch post + r/macapps + lobste.rs", status: "backlog", pr: "low",
    mod: null, ms: "p7", done: false, desc: "Dev-persona channels per PRD.", activity: [] },

  /* ---------- No module / no milestone (in-project, uncategorized) ---------- */
  { p: "disk", title: "Decide tmp app name — 'Disk Advisor' is a placeholder", status: "todo", pr: "low",
    mod: null, ms: null, done: false, desc: "Needs a real name before Phase 5 icon work.", activity: [] },
  { p: "disk", title: "Cancelled: build YAML→JSON compile step for KB", status: "cancelled", pr: "none",
    mod: "kb", ms: "p2", done: false,
    desc: "Dropped — shipping KB as JSON directly, validated by kb-tool. No compile step needed.", activity: [] },

  /* ---------- Personal Site project ---------- */
  { p: "site", title: "Pick a static-site generator", status: "todo", pr: "low",
    mod: "site-build", ms: "site-v1", done: false, desc: "Astro vs plain HTML. Leaning Astro.", activity: [] },
  { p: "site", title: "Write the 'Disk Advisor' build-log post", status: "backlog", pr: "low",
    mod: "site-content", ms: "site-v1", done: false, desc: "The APFS size measurement story is good material.", activity: [] },

  /* ---------- Inbox (no project) ---------- */
  { p: null, title: "Sunburst disk-map visualization — worth it for MVP?", status: "inbox", pr: "none",
    mod: null, ms: null, done: false, desc: "Currently P1. Revisit if beta testers ask for it.", activity: [] },
  { p: null, title: "KB missing JetBrains / VS Code caches", status: "inbox", pr: "none",
    mod: null, ms: null, done: false, desc: "Add entries with real regen knowledge, not a catch-all.", activity: [] },
  { p: null, title: "df-based clone-dedup = 'real freed bytes' (FR-G2b)", status: "inbox", pr: "none",
    mod: null, ms: null, done: false, desc: "Spike APFS purgeable. Open question #3.", activity: [] },
  { p: null, title: "Idea: weekly 'what grew' digest", status: "inbox", pr: "none",
    mod: null, ms: null, done: false, desc: "", activity: [] },
];

/* expand into full records with refs + ids */
function buildTasks() {
  const counters = {};
  return TASKS.map((t, i) => {
    const projKey = t.p ? PROJECTS.find(p => p.id === t.p).key : "INBOX";
    counters[projKey] = (counters[projKey] || 0) + 1;
    return {
      id: "t" + (i + 1),
      ref: t.p ? `${projKey}-${counters[projKey]}` : `INBOX-${counters[projKey]}`,
      projectId: t.p,
      title: t.title,
      status: t.status,
      priority: t.pr || "none",
      moduleId: t.mod || null,
      milestoneId: t.ms || null,
      due: t.due || null,
      done: !!t.done,
      statusNote: t.note || "",
      description: t.desc || "",
      activity: (t.activity || []).map((a, j) => ({ id: `${i}-${j}`, ...a })),
      created: i,
    };
  });
}

window.PMData = {
  STATUSES, STATUS_MAP, BOARD_COLUMNS,
  PRIORITIES, PRIORITY_MAP,
  PROJECT_STATUSES, PROJECT_STATUS_MAP,
  PROJECTS, MODULES, MODULE_MAP, MILESTONES, MILESTONE_MAP,
  WORKSPACES, API_KEYS,
  TASKS: buildTasks(),
};
