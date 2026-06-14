# Handoff: IndieWork — Solo-Dev Project Management Tool

> **Ghi chú (VI):** Đây là gói handoff để một developer (dùng Claude Code) dựng lại
> thiết kế này trong codebase thật. Các file HTML trong gói là **bản design tham
> chiếu** (prototype) — không phải code production để copy nguyên. Toàn bộ phần kỹ
> thuật bên dưới viết bằng tiếng Anh cho khớp với design system và codebase.

---

## Overview

**IndieWork** is a calm, single-person project-management tool — think "Asana for a
solo indie developer." It manages **tasks** that belong to **projects**, grouped along
two independent axes:

- **Module** = a sub-system of a project (e.g. "DiskScanKit", "AdvisorKit")
- **Milestone** = a phase with a target date (e.g. "Phase 2 · Knowledge base")

The signature interaction: click a task → a **detail panel slides in from the right**
without leaving the list. There is deliberately **no multi-user surface** — no
assignees, avatars, mentions, or notifications. Everything belongs to one person.

The design is **light-mode first** but fully token-driven, so a dark theme swaps in
from variables alone (a `[data-theme="dark"]` palette already exists in `tokens.css`).

---

## About the Design Files

The files in this bundle are **design references created in HTML/React+Babel** —
prototypes that demonstrate the intended look, layout, and behavior. They are **not**
production code to lift directly.

The task is to **recreate these designs in the target codebase's existing
environment** (React, Vue, SwiftUI, native, etc.), using its established components,
state patterns, and libraries. If no codebase exists yet, choose the most appropriate
framework and implement the designs there. The prototype happens to be React, but
nothing here mandates React — port the *visual + interaction spec*, not the scaffolding
(no Babel-in-browser, no global `window.*` module pattern, no inline `<script
type="text/babel">`).

**Reuse `tokens.css` almost verbatim.** It is the one piece that *is* close to
production-ready — a clean, framework-agnostic set of CSS custom properties. Drop it in
and map your components onto the variables.

---

## Fidelity: HIGH (hi-fi)

These are **pixel-level mockups** with final colors, typography, spacing, radii,
shadows, motion, and interaction states. Recreate the UI faithfully using the values in
this document and in `tokens.css`. Where this README and the CSS files disagree, **the
CSS files win** — they are the source of truth.

---

## How to Run the Reference

Open either file in a browser (no build step — they use CDN React + Babel):

- `design-system/IndieWork - Design System.html` — the living style guide: every token,
  type ramp, icon, and component rendered with the production stylesheets. **Start
  here.**
- `prototype/IndieWork - Interactive Prototype.html` — the full working app. The app
  boots **locked** behind a password screen (any input unlocks it — it's a decorative
  gate, see §4.8).

---

## Screenshots

Reference captures of each key screen live in `screenshots/`:

| File | Screen |
|---|---|
| `01-login.png` | Minimal lock screen (§4.8) |
| `02-main-task-list.png` | Main task list — grouped by module, quick capture, hover-reveal rows (§4.1) |
| `03-detail-panel.png` | Slide-in detail panel — status note, inline properties, delete (§4.2) |
| `04-board.png` | Kanban board, columns by status (§4.4) |
| `05-inbox.png` | Inbox — uncategorized capture (§4.3) |
| `06-overview-milestones.png` | Project overview + milestones management (§4.5) |
| `07-settings.png` | App settings — API keys (§ App surfaces) |
| `08-global-search.png` | Global search / command palette, ⌘K (§ App surfaces) |

These are static references; the live prototype is the authoritative source for
spacing and motion.

---

## Architecture of the Reference (for orientation)

The prototype is split into small files loaded in order by the HTML shell. This maps
cleanly onto components/modules in a real app:

| File | Responsibility |
|---|---|
| `tokens.css` | **Design tokens** — colors, radii, shadows, status/priority palettes, base resets. Port directly. |
| `app.css` | Layout shell, sidebar, toolbar, buttons, inputs, popovers, modals. |
| `screens.css` | Screen-specific styles — task rows, detail panel, board, overview, settings, search. |
| `data.jsx` | **Sample data + the domain model** — statuses, priorities, projects, modules, milestones, tasks. Read this to understand the data shapes. |
| `icons.jsx` | The icon set (24-grid, 1.7px rounded strokes, `currentColor`). |
| `ui.jsx` | Shared primitives — checkbox, chips, emoji picker, popover, date formatting. |
| `screens-main.jsx` | Sidebar, project tabs, toolbar, quick-capture, task section/rows, bulk action bar. |
| `screens-detail.jsx` | The slide-in **detail panel**. |
| `screens-other.jsx` | Board (kanban), Inbox, Project create form, Login. |
| `screens-overview.jsx` | Project overview tab, modules & milestones management, all-projects table. |
| `screens-app.jsx` | Global search (⌘K), App settings (API keys), workspace create/rename. |
| `app.jsx` | **Root** — all state, routing, mutations, grouping engine, tweak wiring. |
| `tweaks-panel.jsx` / `tweaks-ui.jsx` | A live "tweaks" panel (accent/font/radius/shadow). **Prototype-only chrome — do not ship.** |

---

## Domain Model

Recreate these shapes in your app's models/types. (Source: `prototype/data.jsx`.)

### Task
```
id            string
ref           string   // "DISK-14" — projectKey + per-project counter; Inbox tasks use "INBOX-N"
projectId     string | null   // null = lives in Inbox
title         string
status        enum     // see Statuses below
priority      enum     // none | low | medium | high | urgent
moduleId      string | null
milestoneId   string | null
due           date | null      // "YYYY-MM-DD"
done          boolean          // checking the circle sets done=true, status="done"
statusNote    string           // the pinned "what's blocking me now" line (≠ comments)
description   string           // markdown body
activity      Comment[]        // chronological append-only log
```

### Comment (activity item)
```
id      string
day     string   // "6/13" display form
body    string
source  enum     // web | api | agent   (agent = AI-generated; shown as a tiny badge)
```

### Project
```
id, key ("DISK"), name, emoji ("🧹"), color ("#3FB984"), pinned (bool)
status      enum  // active | planned | paused | done | backlog | cancelled
tags        string[]   // e.g. ["Swift","macOS"]
shortDesc, statusNote, description (markdown)
```

### Module (sub-system)  — `{ id, projectId, name, color }`
### Milestone (phase)    — `{ id, projectId, name, date, state }` where state ∈ planned | active | done
### Workspace            — `{ id, name, emoji, tagline }` (top-level container above projects)
### ApiKey               — `{ id, name, prefix, tail, scope (read|write|read-write), created, lastUsed }`

### Statuses (7) — order matters
`inbox` · `backlog` · `todo` · `in_progress` · `blocked` · `done` · `cancelled`
- **Blocked** leans warm (orange/red) so a stuck task stands out; it pairs with a Status Note.
- **Done / Cancelled** cool to grey and read as "settled" (title strikes through).
- Board (kanban) columns use a subset: `backlog · todo · in_progress · blocked · done`.

### Priorities (5) — rising attention
`none (rank 0)` · `low` · `medium` · `high` · `urgent`
Shown as a small 3-bar indicator (`.pri-bars`), not as loud chips.

---

## Layout

A three-zone horizontal shell that fills the viewport:

```
┌──────────────┬──────────────────────────────────┬──────────────────┐
│  SIDEBAR     │   MAIN COLUMN                     │  DETAIL PANEL    │
│  (always     │   topbar → tabs → quick-capture   │  (slides in from │
│   dark)      │   → grouped task list / board     │   the right when │
│  256px,      │                                  │   a task is      │
│  resizable   │                                  │   selected)      │
│  180–440px   │                                  │  ~420px overlay  │
└──────────────┴──────────────────────────────────┴──────────────────┘
```

- **Sidebar** width is user-resizable (drag handle), clamped 180–440px, persisted to
  `localStorage` (`wb-sidebar-w`). The sidebar is **always dark** regardless of app
  theme — it hard-overrides theme tokens to a cool dark palette so it reads as a
  constant frame.
- **Detail panel** is an overlay; the main list stays visible behind it.

---

## Screens / Views

### 4.1 Main — Task List (primary screen)
- **Topbar**: project emoji (click → emoji picker) + editable name + mono project key.
- **Tabs**: Tasks · Board · Milestones/Overview. Active tab = 2px accent underline
  (`.tab[data-active]`).
- **Quick Capture** (`.qcap`): always-present input with a `+` glyph and a `c` keyboard
  hint. Type + Enter creates a task in the current project (or Inbox) with **zero
  required fields**. This is the star interaction — keep it frictionless. Pressing `c`
  anywhere (when not typing) focuses it.
- **Display controls** (toolbar, kept minimal): **Group by** (Module ⇄ Milestone ⇄
  Status ⇄ Priority), optional sub-group, filters (status, priority), and a "Hide done"
  toggle.
- **Sections**: one per group bucket. Header = color dot + name + task count + a small
  progress bar (% done). A "+ Add task" affordance sits inline at the end of each
  section; new tasks inherit that section's group value.
- A final **"No module" / "No milestone"** section catches uncategorized tasks.
- **Empty state** (`.empty`): friendly emoji + heading + a next-action hint — never a
  dead end.

#### Task Row (the most-seen object — get this exactly right)
- Layout: `[circular checkbox] [title + faint mono ref] … [reveal-on-hover meta]`.
- **Calm at rest**: only title, ref, and checkbox show. Priority bars, due pill, and
  module/milestone tag live in `.task-reveal` and **fade in only on hover or
  selection** (`.12s` opacity). Hover also lifts the row background.
- **Checkbox** (`.circle-check`): empty circle → tick when done; an `in_progress` task
  shows a pie-fill; `cancelled` shows an ×.
- **Blocked rows** surface their status note as a warm second line
  (`.task-note-2nd` with a bolt icon).
- **Done rows** strike through the title and cool the whole row down.
- **Due pill** reddens when overdue (`[data-due="overdue"]`).
- **Selection**: rows are multi-selectable (click + shift-range). When ≥1 selected, a
  **Bulk Action Bar** appears (set status, set priority, mark done, delete, clear).

### 4.2 Detail Panel (slide-in from right) — core interaction
Opens on task click; closes on `×`, `Esc`, or click-outside. Slides in with
`transform` + `cubic-bezier(.22,.61,.36,1)` over `.26s`. Top → bottom:
1. **Ref row**: mono ref "DISK-14" (click to copy) + close `×`.
2. **Title** — edited inline in place.
3. **Status Note** (`.status-note`) — an **elevated, always-visible** box labelled
   "What's blocking / progress" with a bolt icon. The `[data-blocked]` variant uses a
   warm tint. This is a single pinned line that gets overwritten — **it must look
   distinctly different from comments.**
4. **Property row** (`.prop-grid` / `.prop-control`): Status · Priority · Module ·
   Milestone · Due date — each a compact popover-backed inline editor. Empty values are
   dimmed (`[data-empty]`).
5. **Description** — larger markdown editing area.
6. **Activity / Timeline** (`.activity`) — chronological, **append-only** comment log
   (a journal to oneself). Each comment shows day + body + a small source badge
   (web / api / **agent**). A comment box sits at the bottom.
7. **Delete** (`.del-btn`) — neutral until hover, then warm; confirms before acting.

> **Critical distinction:** Status Note (one line, elevated, overwritten, always
> visible) vs Comments (many lines, quiet, append-only history). Never make them look
> alike.

### 4.3 Inbox
Own route from the sidebar, with an unread-count badge. A list of uncategorized tasks
(no project). Each row has a quick **"assign to project"** action (→ then pick
module/milestone). Tone: a low-pressure place to dump ideas. Empty state: "Inbox zero."

### 4.4 Board (Kanban) — secondary view
Toggle with List. Columns by status (`backlog · todo · in_progress · blocked · done`).
Cards (`.board-card`) are drag-and-drop between columns = change status. Card content:
title + priority bars + tag + mono ref. Airy, clean, no heavy borders.

### 4.5 Milestones management
Manage a project's phases: list of milestone cards (`.mile-card`) with name, target
date, state (Planned / Active / Done via `.mile-state`), and a progress bar. Cards are
drag-reorderable (grip handle), creatable, editable.

### 4.6 Modules management
Like milestones but simpler (no dates): name + color dot + reorder.

### 4.7 Project create / edit
Compact form: name, **emoji picker**, color, key (uppercase, e.g. "DISK" — used for
refs), description, and a project-level status note.

### 4.8 Login (minimal)
A single password input + one button. **No signup, no "forgot password", no social.**
It's a decorative lock screen — any input unlocks. Keep it clean and small.

### Additional app surfaces
- **Global Search / Command palette** (`⌘K` / `Ctrl-K`): searches projects + tasks,
  arrow-key navigable, Enter to open. (`.search-modal`.)
- **App Settings**: General (workspace name/tagline) + **API keys** (create with a
  scope, copy-once secret reveal, revoke). (`.settings`, `.ak-row`.)
- **Workspace switcher / create**: workspaces are the top-level container; switch or
  create from the sidebar header.

---

## Interactions & Behavior

- **Quick capture**: type + Enter, no fields. Lands in current project, or Inbox.
- **Hover-reveal**: secondary metadata/actions appear only on hover (`.12s` opacity).
- **Inline edit**: titles, status, priority, dates edited in place via popovers — avoid
  heavy modals.
- **Detail panel**: slides from the right; close on Esc / click-outside; list stays
  behind.
- **Keyboard**: `c` = focus quick-capture (when not typing); `⌘K`/`Ctrl-K` = global
  search; `Esc` closes panels/modals; `↑`/`↓`/`↵` navigate search results.
- **Multi-select + bulk actions** on the task list (shift-click for ranges).
- **Drag**: board cards between columns; milestone/module reordering; sidebar resize.
- **Empty states**: always friendly, always suggest a next action.
- **Motion**: subtle and purposeful only. Panel/modal in = `.26s` ease-out slide;
  content fade = `.2s` ease + 4px rise; hover = `.12s` opacity. **Respect
  `prefers-reduced-motion`** (the tokens already zero out durations under it).

---

## State Management

The reference holds everything in root component state (`app.jsx`). In your app, map
these to your store/state layer:

- `tasks`, `projects`, `modules`, `milestones`, `workspaces`, `apiKeys` — collections.
- `view` — current route: `{ type: "project"|"inbox"|"all"|"settings", projectId?, tab? }`.
- `selectedId` — open task in the detail panel (null = panel closed).
- `selectedIds` (Set) — multi-selection for bulk actions.
- `groupBy` / `subGroupBy` — grouping axes for the task list.
- `filters` — `{ status: [], priority: [], hideDone: bool }`.
- UI flags — `showProjectForm`, `showWsForm`, `showSearch`, `settingsSection`, `locked`.
- **Persisted to localStorage**: sidebar width (`wb-sidebar-w`). (Tweak panel values
  are prototype-only.)

**Mutations** to implement: create task (with auto-ref), update task (patch), toggle
done, add comment, delete task, assign-to-project, bulk update/status/priority/delete,
and CRUD for projects/modules/milestones/workspaces/API keys.

**Grouping engine** (`buildSections` in `app.jsx`): given a primary (and optional
secondary) axis, it expands into ordered buckets, each knowing how to (a) *match* a task
and (b) supply the *patch* applied when a task is created inside it. Tasks sort by:
done last → higher priority first → creation order. Worth porting this structure
directly — it cleanly handles Module/Milestone/Status/Priority with one code path.

---

## Design Tokens

**Port `prototype/tokens.css` directly** — it is the canonical source. Highlights:

### Accent & derivations
- `--accent: #3FB984` (solo-dev green). Derived: `--accent-strong`, `--accent-soft`,
  `--accent-softer`, `--accent-ink`, `--accent-ring` (all via `color-mix` in oklch).

### Neutrals (light) — faint warm tint, hue 95
- Surfaces: `--bg-app` (sidebar/chrome), `--bg-canvas` (main), `--bg-surface` (#fff),
  `--bg-sunken`, `--bg-hover`, `--bg-active`, `--bg-overlay`.
- Borders: `--border`, `--border-soft`, `--border-strong`.
- Text: `--text-strong`, `--text`, `--text-muted`, `--text-faint`.

### Status palette (foreground + `-bg` tint each)
`--st-inbox` · `--st-backlog` · `--st-todo` · `--st-in_progress` · `--st-blocked` ·
`--st-done` · `--st-cancelled` (plus a parallel set for dark theme).

### Priority palette
`--pr-none` (neutral) · `--pr-low` · `--pr-medium` · `--pr-high` · `--pr-urgent`
(rising attention).

### Radii (scaled by `--radius-scale`, default 1)
`--r-xs 4px` · `--r-sm 7px` · `--r-md 10px` · `--r-lg 14px` · `--r-xl 20px` ·
`--r-pill 999px`.

### Elevation (warm-tinted, whisper-soft; scaled by `--shadow-strength`)
`--shadow-sm` (hairline lift) · `--shadow-md` · `--shadow-lg` · `--shadow-panel`
(the slide-in detail panel).

### Typography
- **UI font** `--font-ui`: **Figtree** (Google Fonts; weights 400/500/600/700).
- **Mono font** `--font-mono`: **IBM Plex Mono** (400/500) — for refs, keys, dates,
  code-like tokens.
- Base body: 14.5px / 1.45.

**Type scale** (size · weight · tracking):
| Role | Spec |
|---|---|
| Display / H1 | 44px · 700 · −0.035em |
| Screen title | 20px · 680 · −0.02em |
| Section | 16px · 680 · −0.012em |
| Body / row title | 14px · 550 |
| Base UI | 14.5px · 400 · 1.45 |
| Small / meta | 12.5px · 530 |
| Label / eyebrow | 11px · 650 · 0.04em · UPPERCASE |
| Mono token | 11.5–13px · 500 · IBM Plex Mono |

### Live tweak knobs (optional to expose; prototype defaults shown)
`--radius-scale` (0.5–1.6) · `--shadow-strength` (0–1.6) · `--row-pad-y` (density) ·
`--ui-scale`. These let the whole UI soften/tighten from single variables — nice to
keep as a power-user setting, but not required.

---

## Iconography

One coherent set, defined inline in `prototype/icons.jsx` (and mirrored in the design
system HTML). Specs: **24px grid, 1.7px rounded strokes, `currentColor`**, geometric and
friendly. Icons almost always accompany a label. In a real codebase, either port these
SVG paths or substitute a matching open icon set (e.g. Lucide/Feather) that shares the
same 24-grid, ~1.7px rounded-stroke style — they're intentionally close. Icons used
include: list, board, inbox, plus, close, chevrons, check, flag, calendar, search,
filter, copy, trash, dots, settings, sun, moon, arrowRight, target, layers, cube,
eyeOff, lock, sparkle, globe, bolt, grip, pin, tag, edit, table, sliders, key/keyRound.

---

## Assets

- **Logo / brand mark**: a rounded-square frame holding a single upright "i" bar (one
  tool, one person). Wordmark sets `indie`**`work`**`.space` in Figtree. Full specs,
  clearspace, and treatments are in `design-system/IndieWork - Logo.html`. The favicon
  SVG lives at `design-system/assets/indiework-favicon.svg`.
- **Project emojis / colors**: each project has a hand-picked emoji + identity color
  (see `data.jsx`) used purely for at-a-glance recognition in the sidebar — never to
  signal status.
- No raster imagery is required by the design.

---

## Files in this bundle

```
design_handoff_indiework_pm/
├── README.md                              ← this file (self-sufficient spec)
├── pm-tool-design-brief.md                ← original product/UX brief (VI/EN)
├── design-system/
│   ├── IndieWork - Design System.html     ← living style guide — START HERE
│   ├── IndieWork - Logo.html              ← logo specs & treatments
│   ├── ds.css                             ← styles the doc page only (not product)
│   └── assets/                            ← favicon SVG, etc.
└── prototype/
    ├── IndieWork - Interactive Prototype.html   ← full working app
    ├── tokens.css     ← DESIGN TOKENS — port directly
    ├── app.css, screens.css               ← component & screen styles (reference)
    ├── data.jsx       ← domain model + sample data
    ├── icons.jsx, ui.jsx                  ← icon set + shared primitives
    ├── app.jsx        ← root: state, routing, grouping engine, mutations
    ├── screens-main.jsx, screens-detail.jsx, screens-other.jsx,
    │   screens-overview.jsx, screens-app.jsx    ← screens
    └── tweaks-panel.jsx, tweaks-ui.jsx          ← prototype-only chrome (do NOT ship)
```

## Implementation order (suggested)

1. Drop in `tokens.css`; wire your theme to the variables (incl. the `[data-theme]`
   light/dark split).
2. Build the **three-zone shell** (dark sidebar, main column, right detail overlay).
3. Build the **task row** + grouped **section** + **quick capture** — the core loop.
4. Build the **detail panel**, nailing the Status-Note-vs-Comments distinction.
5. Add Board, Inbox, Overview/Milestones/Modules, Search, Settings, Login.
6. Layer in interactions: hover-reveal, inline edit, multi-select/bulk, drag, keyboard.

---

*The design system HTML and the prototype are both rendered with the same production
stylesheets, so they are guaranteed consistent. When a detail is ambiguous in this
README, open the design system page and inspect the live element.*
