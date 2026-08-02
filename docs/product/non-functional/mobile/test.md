# Mobile & Standalone — Verification Run

> Measurement evidence for the requirements in **[spec.md](spec.md)**, complementing the
> by-construction status in **[plan.md](plan.md)**. Records what was exercised against a
> **production build** in emulated Chrome — not on physical hardware.
>
> **Run date:** 2026-08-02 · branch `cursor/mobile-ux-standalone-5ef2` · Playwright + system Chrome.

## Environment under test

| | |
|---|---|
| **App** | `pnpm build` + `pnpm start` (production) |
| **DB** | SQLite (`DB_DRIVER=sqlite`), seeded sample projects |
| **Viewports** | Emulated iPhone 13 (390×844, `hasTouch`, `pointer: coarse`) · 1440×900 desktop regression |
| **Tooling** | Playwright harness outside the repo, system Chrome |

### Topology caveat

Emulated Chrome can confirm layout, touch CSS, drawer/sheet behaviour, and PWA installability
criteria. It **cannot** produce a non-zero `env(safe-area-inset-*)`, a real on-screen keyboard, or
iOS Safari focus-zoom. Items that depend on those stay `[~]` in [plan.md](plan.md).

### Auth

Session is an `httpOnly` signed cookie. The run used a local admin account on the SQLite DB.
Credentials are not recorded here.

---

## A. Layout & shell — PASS

| ID | Probe | Result |
|----|-------|--------|
| MB-L1 | Horizontal overflow at 390px across 7 screens | No unintended overflow; board scrolls sideways by design |
| MB-L2 | Task-row title width at 390px | Title readable; ref column / status reveal / meta chips dropped |
| MB-L3 | Overview scroll at 390px | `.overview` is the scroll container (619px box / 1097px content) |
| MB-L4 | Project header (`.tabs`) height at 390px | 45px for 44px of content (was 13px) |
| MB-L5 | Shell tracks at 390px | Sidebar = overlay drawer; detail = full-screen sheet |
| MB-L7 | Bulk bar / toast positioning | `--safe-b` applied; bulk bar not centred on a missing sidebar track |
| — | Desktop regression at 1440px | `230px / 1202px / 0px` tracks, static sidebar, resizers, 384px detail — unchanged |

## B. Touch — PASS (emulated)

| ID | Probe | Result |
|----|-------|--------|
| MB-T1 | Coarse-pointer reveal rules | Multi-select, pin, section add, etc. visible; rename pencil + status chip stay hidden |
| MB-T2 | Drag grips + Overview reorder | Grips `display: none`; move up/down changes order **and persists across reload** |
| MB-T4 | Viewport meta | `maximumScale: 5` |

## C. Standalone / PWA — PASS (installability)

| ID | Probe | Result |
|----|-------|--------|
| MB-S1 | `Page.getInstallabilityErrors` (persistent profile) | `[]` |
| MB-S1 | Manifest parse + icons | Zero parse errors; four `/icons/*.png` return 200 |
| MB-S3 | `start_url` | `/app` |
| — | Service worker | None — intentional; see [solution.md §5](solution.md) |

## D. Engineering gates — PASS

| Check | Result |
|-------|--------|
| `pnpm lint` | 0 errors; warning set identical to base |
| `pnpm typecheck` / `pnpm test` | clean · 258 passed, 30 skipped |
| Console errors (7 screens × 2 viewports) | none |
| CSP on soft navigation | none after skeletons stopped importing client `NavToggle` |

## E. Not covered (needs a physical device)

MB-L6 (keyboard), MB-T3 / MB-T5 / MB-T6 (iOS zoom, tap highlight, overscroll), MB-S2 / MB-S5 /
MB-S7 (real standalone launch, non-zero safe-area, home-screen icon eyeball). Closing these is one
pass on an iPhone and one on an Android phone — see [plan.md](plan.md).
