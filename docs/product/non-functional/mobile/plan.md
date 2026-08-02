# Mobile & Standalone — Solution Status (Living Tracker)

> Maps each requirement in **[spec.md](spec.md)** (the source of truth) to its current state.
> **Unmet requirements stay unchecked todos here.** The *design* behind each item lives in
> **[solution.md](solution.md)** (organised by mechanism); this file links into it and only tracks
> status.

**Legend:** `[x]` ✅ met · `[~]` 🚧 partial / by-construction-unverified · `[ ]` ⬜ not started

**Snapshot date:** 2026-08-02 · branch `cursor/mobile-ux-standalone-5ef2`.

Shipped this pass: the shell's phone layout (drawer + bottom sheet), a selective coarse-pointer
reveal with a non-drag reorder fallback, a per-screen responsive pass, and PWA installability.
Verified against a **production build** in emulated Chrome (see [Verification](#verification)) —
not on physical hardware, which is the main gap below.

---

## MB-L — Layout

- [x] **MB-L1** — No horizontal overflow. Verified at 390px on project list, board, Inbox,
  All projects, Settings, Overview and the task sheet. The board scrolls sideways by design and
  snaps one column per screen. → design: [solution.md §3](solution.md).
- [x] **MB-L2** — Row titles are legible. Was the worst failure found: the 60px ref column, the
  84px slot the hidden status chip reserves and the module/milestone chips together exceeded a
  390px viewport, rendering titles as a **single character**. All three are dropped below the
  breakpoint and remain in the detail sheet.
- [x] **MB-L3** — Nothing unreachable. Fixed a real bug the narrow viewport exposed: the overview
  had **no scroll container at all** (`.main-col` is `overflow: hidden` and `.overview` declared
  neither `flex: 1` nor `overflow-y`), so at 390px its lower 478px of 1097px was unreachable. It is
  now the scroll container, with the width cap moved to `.ov-vlayout` so the scrollbar still rides
  the right edge.
- [x] **MB-L4** — Headers not squeezed. `.tabs` had no `flex: none`, so a tall page shrank it from
  45px to **13px** and clipped its own contents.
- [x] **MB-L5** — One surface at a time. Sidebar is an overlay drawer; the inspector is a
  full-screen sheet. → design: [solution.md §3](solution.md).
- [~] **MB-L6** — Dialogs fit. Modals and the palette are near-full-screen and sized in `dvh`.
  **Not verified with a real on-screen keyboard** — emulated Chrome has none.
  *Todo: open the command palette and a create-project modal on a physical phone.*
- [x] **MB-L7** — Fixed chrome clears the OS. Bulk bar and toasts add `--safe-b`; the bulk bar no
  longer centres itself on a sidebar track that doesn't exist below the breakpoint. Inset values
  themselves are unverified — see MB-S5.

## MB-T — Touch input

- [x] **MB-T1** — No hover-only actions. Multi-select, pin, section add, attachment actions,
  sub-task chevron, tab close and milestone/module delete are unhidden on `(pointer: coarse)`;
  the rename pencil and the duplicate status chip stay hidden on purpose.
  → design: [solution.md §4](solution.md).
- [x] **MB-T2** — No false affordances. Drag grips are hidden on coarse pointers. Overview reorder
  swaps in move up/down buttons — verified to reorder **and persist across a reload**. Board card
  moves route through the detail sheet.
- [~] **MB-T3** — No zoom on focus. A `max(16px, 1em)` floor is applied on coarse pointers.
  **Holds by construction; not verified on real iOS Safari**, which is the only engine with the
  behaviour. *Todo: tap quick-capture on an iPhone and confirm the scale is unchanged.*
- [x] **MB-T4** — Pinch-zoom available. `maximumScale: 5`, never 1.
- [~] **MB-T5** — Immediate taps. `touch-action: manipulation` on controls,
  `-webkit-tap-highlight-color: transparent`, and tooltips suppressed on coarse pointers.
  *Todo: confirm no residual highlight on a physical Android device.*
- [~] **MB-T6** — Scroll stays inside the app. `overscroll-behavior-y: none` on `<html>`.
  *Todo: confirm no pull-to-refresh on Chrome Android.*

## MB-S — Standalone

- [x] **MB-S1** — Installable. `Page.getInstallabilityErrors` returns **`[]`** against the
  production build in a persistent Chrome profile; the manifest parses with zero errors and all
  four icons return 200. No service worker — see [solution.md §5](solution.md) for why that is a
  decision, not a gap.
- [~] **MB-S2** — Launches standalone. `display: standalone` is set and the manifest is valid.
  **Not verified on a device** — Chrome's `Emulation.setEmulatedMedia` would not report
  `(display-mode: standalone)` in this environment. *Todo: install on Android and iOS and confirm
  no URL bar.*
- [x] **MB-S3** — Opens the workspace. `start_url: /app`.
- [x] **MB-S4** — Session survives relaunch. `SESSION_MAX_AGE` is 30 days; no change needed.
- [~] **MB-S5** — Correct under OS furniture. `viewport-fit=cover` plus `--safe-*` on every fixed
  element, and `.app` pads by `max(shell-gap, safe-top)` at all widths.
  **The insets resolve to 0 in every environment tested**, so the non-zero path is unexercised.
  *Todo: check the top bar, bulk bar and toasts on a notched device in both orientations.*
- [x] **MB-S6** — Navigable without browser chrome. The sheet has a close button, the standalone
  task page a back link, and the drawer reaches every screen.
- [~] **MB-S7** — Icon correct per platform. Maskable and apple-touch variants are square, and the
  glyph sits inside the maskable safe zone (corner at 33.9 units from centre, safe radius 40).
  *Todo: eyeball the home-screen icon on Android and iOS.*

---

## Verification

Run against `pnpm build` + `pnpm start` on a SQLite dev database, driven with Playwright over the
system Chrome. Emulated iPhone 13 (390×844, `hasTouch`, `pointer: coarse` confirmed) plus a
1440×900 desktop context as the regression control.

| Check | Result |
|---|---|
| Desktop shell after all changes | `230px 1202px 0px` tracks, 8px pad, static sidebar, resizers present, 384px detail panel — unchanged |
| Overview scroll container (mobile) | `.overview`, 619px box over 1097px content (was: none) |
| Project header height (mobile) | 45px for 44px of content (was: 13px) |
| Overview reorder via move buttons | Order changed and survived a reload |
| Drag grips on coarse pointer | `display: none` |
| `NavToggle` visibility | `none` at 1440px, `grid` at 390px |
| Manifest parse errors | `[]` |
| Icons `/icons/*.png` | 4 × 200 |
| `Page.getInstallabilityErrors` (persistent profile) | `[]` |
| Console errors across 7 screens, both viewports | none |
| CSP violations, production build, after soft navigation | none (see below) |
| `pnpm lint` | 0 errors; warning set **identical** to the base commit |
| `pnpm typecheck` / `pnpm test` | clean · 258 passed, 30 skipped |

### One regression caught and fixed during verification

An early revision imported the client `NavToggle` into the server-component `skeletons.tsx`. That
opened a client boundary, and the chunk Next emitted for it was injected on soft navigation
**without a nonce**, which `strict-dynamic` blocked. Confirmed by differential test: the base
commit reported zero CSP-blocked chunks, the branch reported exactly one, and it was that chunk.
The skeletons now render an inert placeholder. → [solution.md §3](solution.md).

### Not covered

Everything marked `[~]` above shares one root cause: **no physical device was available.** The
untested surface is specifically the three things an emulator cannot produce — a non-zero
`env(safe-area-inset-*)`, a real on-screen keyboard, and iOS Safari's focus-zoom behaviour. A pass
on one iPhone and one Android phone would close MB-L6, MB-T3, MB-T5, MB-T6, MB-S2, MB-S5 and
MB-S7 together.
