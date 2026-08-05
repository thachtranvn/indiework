# Mobile & Standalone — Technical Solution (IndieWork)

> **How** IndieWork meets the bar in [spec.md](spec.md), organised **by mechanism** rather than by
> requirement ID. This is the durable design: the patterns, why they hold, and the trade-offs.
>
> The triad: **[spec.md](spec.md)** = *what* · **this file** = *how* ·
> **[plan.md](plan.md)** = *status*.
>
> Stack snapshot: Next.js 16.2.9 · React 19.2.4 (`reactCompiler: true`) · no CSS framework —
> semantic classes in [`src/styles/`](../../../../src/styles/) (there is no Tailwind in this repo,
> so there are no `sm:` / `md:` utilities to reach for).

---

## 1. One breakpoint, declared once

Everything phone-shaped keys off a single width: **760px**. It is declared as `--bp-mobile` in
[tokens.css](../../../../src/styles/tokens.css) and repeated as a literal in each `@media` (CSS
cannot read a custom property in a media query), with that declaration as the canonical reference.

Touch behaviour keys off `(pointer: coarse)` instead, deliberately: a touchscreen laptop needs the
hover fixes at 1440px, and an external mouse on a tablet does not.

## 2. CSS first, JavaScript only where CSS can't reach

The shell's phone layout is almost entirely CSS. `useIsMobile`
([use-media-query.ts](../../../../src/lib/use-media-query.ts)) exists, but it is built on
`useSyncExternalStore` and returns `false` for the server snapshot, so its value is only correct
from the first render *after* hydration. That makes it unsuitable for anything that must be right
in the first painted frame.

The division that falls out:

| Concern | Mechanism | Why |
|---|---|---|
| Three tracks → one; drawer; sheet; hidden resizers | CSS `@media` | Correct in the first frame, no hydration flash |
| Which *state* the drawer is in | React state in `AppShell` | Needs an event and a lifecycle |
| Whether the toggle collapses the rail or opens the drawer | `useIsMobile` | One frame late is invisible — it can only be wrong before the user has tapped anything |

## 3. The shell: two overlays instead of two tracks

Below the breakpoint, [app.css](../../../../src/styles/app.css) collapses `.app` to
`grid-template-columns: minmax(0, 1fr)` and takes both side panels out of flow:

- **Sidebar → drawer.** `position: fixed`, translated off-canvas, slid in by `.app[data-drawer]`,
  with a scrim button behind it. While closed it is `pointer-events: none` + `visibility: hidden`
  — iOS otherwise hit-tests the composited off-canvas layer and swallows taps on the list
  (scroll and text inputs still work; buttons and rows do not). The drawer needs state that
  `collapsed` cannot supply:
  `collapsed` is persisted to `localStorage`, so reusing it would launch the drawer already open
  just because the rail was left expanded on a desktop. `AppShell` therefore keeps a separate
  `drawer` state, and suppresses `data-sb-collapsed` entirely on mobile so the collapsed rail's
  `pointer-events: none` can't disable the drawer.
- **Detail panel → full-screen sheet.** `position: fixed; inset: 0`, hidden outright when closed
  (`inset: 0` on an empty slot would otherwise park a transparent overlay over the list), and
  animated with the same right→left `translate3d(100vw)` slide as desktop so
  `DETAIL_EXIT_MS` still matches.

The drawer closes on navigation. That is done by **adjusting state during render** (comparing the
tracked path with `usePathname()`) rather than in an effect — the same pattern the file already
uses for `lastOpen` — so the drawer never paints for one frame over the page it just left.

The mouse-only resizers and the floating expand button are `display: none` on mobile rather than
conditionally rendered: CSS gets it right in the first frame, and the handlers are unreachable on
a hidden element anyway.

### Entry points to the drawer

`ProjectTabs` already dispatched `iw:toggle-sidebar`; `AppShell` now interprets that one event
differently per breakpoint. Screens with no project header to host it — Inbox, All projects,
Settings — render `NavToggle` ([nav-toggle.tsx](../../../../src/components/app/nav-toggle.tsx)),
which is `display: none` above the breakpoint.

**`skeletons.tsx` must not import it.** That file is a server component; importing a client
component into it opens a client boundary, and the extra chunk Next emits for that boundary is
injected during soft navigation *without a nonce*, which the app's `strict-dynamic` CSP
([proxy.ts](../../../../src/proxy.ts)) then blocks. The skeletons render an empty
`<span className="nav-toggle">` instead, which reserves the same box for CLS at zero cost.

## 4. Touch: reveal selectively, never fake a gesture

The design hides ~11 controls behind `:hover` with `opacity: 0`. Unhiding all of them on touch
would clutter a phone, so the coarse-pointer blocks unhide only the ones with **no other route**:
multi-select, the project pin, the sidebar section's add button, attachment actions, the sub-task
chevron, the tab close, and milestone/module delete.

Two are deliberately left hidden: the row's rename pencil (tapping the row opens the task, where
the title is editable — a 13px pencil beside the title is a mis-tap magnet) and the duplicate
status chip (the status circle already carries it, and its slot reserves 84px).

Drag grips go the **other** way. HTML5 drag-and-drop cannot fire on touch, so showing a grip would
advertise a gesture that fails. They are hidden, and:

- **Overview reorder** swaps in explicit move up/down buttons backed by a `move(id, delta)` added
  to the existing `useDragReorder` hook — the same persistence path the drop handler uses.
- **Board card moves** need nothing new: tapping a card opens the sheet, where the field the
  column is grouped by (status, module, milestone) is directly editable.

Tooltips are suppressed on coarse pointers in
[tip-host.tsx](../../../../src/components/ui/tip-host.tsx): a tap synthesises `mouseover` with no
matching `mouseout`, which left the tip parked over the UI until the next tap elsewhere. The check
reads a live `MediaQueryList` inside the listener rather than a hook, so a hybrid device tracks
correctly. Focus-driven tips are untouched.

**No `:hover` paint on touch.** iOS (and some Android browsers) treat the first tap as `:hover`
and withhold the click whenever hover restyles the target — especially when it reveals
`opacity: 0` children. A PostCSS step ([postcss-hover-media.mjs](../../../../postcss-hover-media.mjs))
wraps author `:hover` rules in `@media (hover: hover) and (pointer: fine)` so phones (and iPad
finger taps) never match them. Mixed selectors are split first, so `[data-open]` /
`:focus-visible` / `[data-selected]` still apply. Hidden hover-reveals also use
`pointer-events: none` until they are shown, so an invisible pencil or pin cannot steal the tap.

### Ordering matters more than specificity here

Every one of these overrides competes at **equal specificity** with the rule it overrides, so it
wins only on source order. Import order is `tokens.css → app.css → screens.css`, so each file's
mobile/touch block lives at the **end of that same file** — a block in `app.css` cannot override a
`screens.css` selector at all. This is the one thing to remember when adding to these blocks.

## 5. Standalone: a manifest, and deliberately no service worker

[manifest.ts](../../../../src/app/manifest.ts) is a Next metadata route
(`/manifest.webmanifest`). `start_url` is `/app`, not `/`: the landing page only bounces a
signed-in visitor onwards, and an installed app should open on the work.

Icons are PNGs in [`public/icons/`](../../../../public/icons/) rasterised from
[icon.svg](../../../../src/app/icon.svg) at 192, 512 and 512-square. The maskable and
apple-touch variants are square on purpose — Android applies its own mask and iOS rounds the
icon, so baking in rounded corners leaves dark notches.

Only the standardised `mobile-web-app-capable` tag is emitted. The apple-prefixed `title` and
`status-bar-style` tags are omitted deliberately: iOS has treated them as legacy since 11.3, and
they make Safari fall back to a manifest-less install that ignores `start_url` and `scope`.

**There is no service worker, and that is a decision rather than an omission.** Chrome reports
zero installability errors without one (see [plan.md](plan.md)), so MB-S1 does not need it. What
one would buy is an offline banner — every route here is `force-dynamic` behind a session cookie,
so there is no useful read-only state to serve. What it would cost is a persistent cache in front
of a dynamic app: precisely the stale-client failure mode the codebase already works around after
deploys (see the Server Action version-skew handling in
[detail-panel.tsx](../../../../src/components/app/detail-panel.tsx)). If a custom install prompt
is ever wanted, `beforeinstallprompt` does require a service worker, and that is the point to
revisit this.

MB-S4 needs no work: the session cookie's TTL is 30 days
([session.ts](../../../../src/server/auth/session.ts)), so a cold launch lands in the app.

## 6. Safe areas

`viewport-fit=cover` lets the layout paint under the notch, and every fixed element pays that back
with `--safe-t/-r/-b/-l` (thin wrappers over `env(safe-area-inset-*)`, defaulting to `0px`).

`.app` uses `padding-top: max(var(--shell-gap), var(--safe-t))` at **every** width, not only on
phones: an installed app on a notched tablet keeps the three-track layout, so the phone block never
runs for it, and it would otherwise render its first ~47px under the status bar.

Because the insets resolve to `0px` in a normal browser tab, the same rules cover browser and
standalone with no `@media (display-mode: standalone)` block — one code path, and the one that
gets exercised in day-to-day development.

`100dvh` on `.app` (with `100%` as the fallback) tracks the mobile browser's collapsing address
bar; dialogs use `dvh` for the same reason, so the on-screen keyboard cannot push their actions
out of reach.

## 7. iOS input zoom

iOS Safari force-zooms the page whenever a focused field renders below 16px and never zooms back
out. The app's fields are 12.5–13.5px, so every tap into quick-capture, search, or a settings
field would strand the user zoomed in.

The fix is a single coarse-pointer rule in tokens.css setting
`font-size: max(16px, 1em) !important` on fields. The `!important` is deliberate: field sizes are
set by a dozen class-scoped rules with higher specificity, and this is a browser-behaviour
workaround rather than a design choice — the same justification the file's existing
`prefers-reduced-motion` override uses. `max()` leaves anything already larger alone (the 27px task
title).
