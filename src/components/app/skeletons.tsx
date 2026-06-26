/**
 * Loading skeletons for the app segments (perceived-performance PP-R1/R2/R3).
 *
 * Each app route's `loading.tsx` renders one of these as the App Router's
 * automatic Suspense fallback, so a navigation shows an instant structural
 * placeholder instead of a blank screen or a frozen copy of the previous view
 * (PP-R2). The persistent layout shell stays painted while the page's slow data
 * streams in behind the skeleton (PP-R1). Skeletons reuse the *real* layout
 * container classes (`.topbar`, `.qcap`, `.scroll-body`, `.task-row`, …) so the
 * placeholder occupies the same boxes as the real content — keeping CLS low
 * across the swap (PP-R3).
 *
 * Server components (no interactivity), rendered once as a fallback — widths are
 * varied deterministically by index, never randomly.
 */
import type { CSSProperties } from 'react';

/** A single shimmer bar. */
function Bar({ w = '100%', h = 12, r = 6, style }: { w?: number | string; h?: number; r?: number; style?: CSSProperties }) {
  return <span className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden />;
}

// Deterministic, non-uniform widths so a column of rows reads as content, not a grid.
const ROW_WIDTHS = ['58%', '72%', '44%', '64%', '51%', '69%', '47%', '61%'] as const;

function RowSkeleton({ i, indent = 12 }: { i: number; indent?: number }) {
  return (
    <div className="task-row" style={{ paddingLeft: indent }} aria-hidden>
      <Bar w={18} h={18} r={9} />
      <Bar w={ROW_WIDTHS[i % ROW_WIDTHS.length]} />
    </div>
  );
}

function SectionSkeleton({ start, rows }: { start: number; rows: number }) {
  return (
    <div className="section" aria-hidden>
      <div className="skel-sec-head">
        <Bar w={15} h={15} r={4} />
        <Bar w={120} h={13} />
        <Bar w={22} h={12} style={{ marginLeft: 2 }} />
      </div>
      <div className="skel-rows">
        {Array.from({ length: rows }, (_, k) => (
          <RowSkeleton key={k} i={start + k} />
        ))}
      </div>
    </div>
  );
}

/** A capture-bar placeholder matching `.qcap`. */
function CaptureSkeleton() {
  return (
    <div className="qcap" aria-hidden>
      <div className="qcap-inner">
        <Bar w={18} h={18} r={5} />
        <Bar w="40%" h={14} />
      </div>
    </div>
  );
}

/** Project list/board view — the most-navigated surface (switching projects). */
export function ProjectViewSkeleton() {
  return (
    <div className="loading-screen" aria-busy="true" aria-label="Loading project…">
      <div className="skel-strip">
        <Bar w={120} h={26} r={8} />
        <Bar w={64} h={26} r={8} />
        <Bar w={64} h={26} r={8} />
        <Bar w={80} h={26} r={8} style={{ marginLeft: 'auto' }} />
      </div>
      <CaptureSkeleton />
      <div className="scroll-body">
        <SectionSkeleton start={0} rows={4} />
        <SectionSkeleton start={4} rows={3} />
      </div>
    </div>
  );
}

/** Inbox — topbar + capture + flat rows. */
export function InboxSkeleton() {
  return (
    <div className="loading-screen" aria-busy="true" aria-label="Loading inbox…">
      <div className="topbar">
        <div className="topbar-title">
          <Bar w={26} h={26} r={7} />
          <Bar w={90} h={22} />
        </div>
      </div>
      <CaptureSkeleton />
      <div className="scroll-body">
        <div className="skel-rows">
          {Array.from({ length: 6 }, (_, k) => (
            <RowSkeleton key={k} i={k} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** All projects — topbar + grouped project rows. */
export function AllProjectsSkeleton() {
  return (
    <div className="loading-screen" aria-busy="true" aria-label="Loading projects…">
      <div className="topbar">
        <div className="topbar-title">
          <Bar w={26} h={26} r={7} />
          <Bar w={120} h={22} />
        </div>
      </div>
      <div className="scroll-body">
        <SectionSkeleton start={0} rows={3} />
        <SectionSkeleton start={3} rows={2} />
      </div>
    </div>
  );
}

/** Project overview — sticky vnav + a panel of field rows. */
export function OverviewSkeleton() {
  return (
    <div className="loading-screen" aria-busy="true" aria-label="Loading overview…">
      <div className="skel-strip">
        <Bar w={120} h={26} r={8} />
        <Bar w={64} h={26} r={8} />
      </div>
      <div className="overview">
        <div className="ov-vlayout">
          <nav className="ov-vnav" aria-hidden>
            <Bar w="100%" h={32} r={8} />
            <Bar w="100%" h={32} r={8} />
            <Bar w="100%" h={32} r={8} />
          </nav>
          <div className="ov-vpanel" aria-hidden>
            {Array.from({ length: 6 }, (_, k) => (
              <div key={k} style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'center' }}>
                <Bar w={120} h={13} />
                <Bar w={ROW_WIDTHS[k % ROW_WIDTHS.length]} h={34} r={8} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Settings — a stack of field cards. */
export function SettingsSkeleton() {
  return (
    <div className="loading-screen" aria-busy="true" aria-label="Loading settings…">
      <div style={{ padding: '28px 30px', maxWidth: 640 }} aria-hidden>
        <Bar w={160} h={22} />
        <Bar w="70%" h={13} style={{ marginTop: 12 }} />
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 4 }, (_, k) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Bar w={90} h={12} />
              <Bar w="100%" h={38} r={8} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
