# IndieWork — Mobile & Standalone (Requirements / Source of Truth)

> The durable definition of **what IndieWork must do on a phone**, and what it must do once
> installed to a home screen. This file states the **what** (behaviour the user must experience).
> It does *not* prescribe *how* — the **design** lives in **[solution.md](solution.md)** and the
> **status** in **[plan.md](plan.md)**, where any unmet requirement stays an unchecked todo.
>
> This document changes only when the **bar** changes — not when a solution ships.
> Sibling source-of-truth: product = [scope.md](../../scope.md); ordering =
> [roadmap.md](../../roadmap.md).

---

## 0. How to read this

- Each requirement has a **stable ID** (`MB-L1`, `MB-T2`, …). IDs are permanent; never renumber.
- Each requirement is **testable**: an observable behaviour or a measurable target. "Works on
  mobile" is not a requirement; "no horizontal scroll at 320px" is.
- Each requirement is **solution-agnostic** — no requirement names a CSS technique, a hook, or a
  library.
- **Reference viewport** is 390×844 CSS px (iPhone 13 / a mid-range Android), the narrowest
  supported width is **320px**, and the breakpoint below which a device counts as a phone is
  **760px**. Coarse-pointer behaviour keys off the *input*, not the width — a touchscreen laptop
  is a coarse pointer at 1440px.

### ID categories

| Prefix | Surface | The required experience |
|--------|---------|-------------------------|
| **MB-L** | Layout | Every screen fits the viewport and stays legible; nothing important is clipped, and nothing is unreachable. |
| **MB-T** | Touch input | Every action reachable with a mouse is reachable with a finger, and no affordance promises a gesture the device can't perform. |
| **MB-S** | Standalone | The app installs to a home screen, launches without browser chrome, and behaves correctly inside the OS's own furniture (status bar, home indicator, notch). |

---

## 1. Context — why this is a bar and not a feature

IndieWork's shell was built as a three-column desktop grid: a sidebar rail, a task list, and a
384px inspector, all visible at once. That composition has no meaning at 390px — three columns
that each need 230–384px cannot share a phone. The design also leans on `:hover` to reveal
secondary controls and on HTML5 drag-and-drop to reorder things, and a touch screen fires neither.

So "mobile support" is not a screen to add; it is a **quality bar every screen has to clear**, the
same way perceived performance is. A screen that renders at 390px but hides its own content behind
an unscrollable overflow has not cleared it.

**Standalone** here means the PWA display mode: the app launched from a home-screen icon with no
URL bar and no browser back button. That removes affordances the app may have been leaning on, so
it is a behavioural requirement, not just a manifest file.

---

## 2. MB-L — Layout

- **MB-L1 — No horizontal overflow.** At any width from 320px up, no screen scrolls horizontally
  except where sideways scrolling is the point (a board's columns). Content adapts; it is never
  merely shrunk until it overflows.

- **MB-L2 — The primary content of a row is legible.** Where a list row has one thing it exists to
  identify — a task's title, a project's name — that text gets the width it needs. Secondary
  metadata yields first, and anything dropped stays reachable one interaction away.

- **MB-L3 — Nothing is unreachable.** Every screen whose content can exceed the viewport has a
  scroll container. No content is rendered outside the visible area with no way to bring it into
  view.

- **MB-L4 — Headers are not squeezed.** Persistent chrome (project header, top bar) keeps its full
  height regardless of how tall the page below it is, and never clips its own contents.

- **MB-L5 — One thing at a time.** On a phone the shell shows one surface at a time. Navigation
  and the task inspector each take the screen when open and give it back when dismissed; neither
  competes with the list for width.

- **MB-L6 — Dialogs fit.** Modals, the command palette, and the inspector are usable with the
  on-screen keyboard open: their primary actions stay reachable rather than being pushed off the
  bottom of the viewport.

- **MB-L7 — Fixed chrome clears the OS.** Anything pinned to a viewport edge (bulk-action bar,
  toasts) sits clear of the notch, the status bar, and the home indicator.

## 3. MB-T — Touch input

- **MB-T1 — No hover-only actions.** Any action whose only entry point is a hover-revealed control
  is reachable on a touch device, or has an equivalent route that is.

- **MB-T2 — No false affordances.** The UI does not display a control for a gesture the device
  cannot perform. Where a drag is the desktop route, touch gets an explicit alternative or the
  handle is not shown at all.

- **MB-T3 — Tapping a field does not zoom.** Focusing any text input leaves the page at its
  current zoom level. (iOS Safari force-zooms fields under 16px and does not zoom back out.)

- **MB-T4 — Pinch-zoom stays available.** The page is never locked to a fixed scale.

- **MB-T5 — Taps feel immediate.** Controls respond without the browser's double-tap-to-zoom
  delay, and tapping does not leave a residual highlight or a stuck tooltip.

- **MB-T6 — Scrolling stays inside the app.** A scroll that reaches the end of a list does not
  turn into a page-level bounce or a pull-to-refresh.

## 4. MB-S — Standalone

- **MB-S1 — Installable.** The app meets the browser's install criteria with no warnings: a valid
  manifest, a reachable icon set at the sizes the platform requires, and a secure origin.

- **MB-S2 — Launches standalone.** Opened from the home-screen icon, the app runs without browser
  chrome on both Android and iOS.

- **MB-S3 — Launches into the app, not the marketing page.** The install target opens the
  authenticated workspace directly.

- **MB-S4 — The session survives relaunch.** A user who installed the app and signed in is not
  returned to the sign-in screen on a later cold launch within the session's lifetime.

- **MB-S5 — Correct under the OS furniture.** With browser chrome gone, the app renders clear of
  the status bar, the notch, and the home indicator in both orientations.

- **MB-S6 — Navigable without browser chrome.** No task requires the browser's back button. Every
  screen that can be entered can be left from within the app.

- **MB-S7 — The icon is correct on each platform.** The home-screen icon renders without dark
  corners or unintended cropping under Android's adaptive mask and iOS's rounding.

---

## 5. Explicit non-goals

- **Offline use.** Every route is authenticated and server-rendered per request; there is no
  meaningful read-only offline mode to fall back to, and a cache layer in front of a dynamic app
  is a liability rather than a feature. See [solution.md §5](solution.md).
- **Touch drag-and-drop.** Re-implementing board and reorder drags as pointer-driven gestures is
  out of scope; MB-T2 requires an alternative route, not a port of the gesture.
- **A separate mobile app or a separate mobile codebase.** One responsive app, one set of
  components.
- **Landscape-optimised layouts.** Landscape must be correct (MB-S5), not specially designed.
