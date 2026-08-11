/**
 * Design System section slugs — shared by the gallery UI and App Router pages.
 * Kept free of 'use client' so server routes can validate / generate metadata.
 */

export type DsItemId =
  | 'colors-primitive'
  | 'colors-semantic'
  | 'colors-legacy'
  | 'radii-shadows'
  | 'typography'
  | 'brand'
  | 'buttons'
  | 'segmented'
  | 'chips'
  | 'kbd'
  | 'tooltips'
  | 'inputs'
  | 'status'
  | 'priority'
  | 'entity-icons'
  | 'progress'
  | 'refs'
  | 'navigation'
  | 'icons'
  | 'switch'
  | 'feedback';

export const DEFAULT_DS_ITEM: DsItemId = 'colors-primitive';

export const DS_ITEM_IDS: readonly DsItemId[] = [
  'colors-primitive',
  'colors-semantic',
  'colors-legacy',
  'radii-shadows',
  'typography',
  'brand',
  'buttons',
  'segmented',
  'chips',
  'kbd',
  'tooltips',
  'inputs',
  'status',
  'priority',
  'entity-icons',
  'progress',
  'refs',
  'navigation',
  'icons',
  'switch',
  'feedback',
] as const;

export const DS_ITEM_META: Record<DsItemId, { title: string; note: string }> = {
  'colors-primitive': {
    title: 'Colors: Primitive',
    note: 'Foundations color scales — source of truth for semantic aliases.',
  },
  'colors-semantic': {
    title: 'Colors: Semantic',
    note: 'Foundations semantic roles (text · fg · bg · outline) — each aliases a primitive.',
  },
  'colors-legacy': {
    title: 'Colors: Legacy',
    note: 'Current app tokens — surfaces, text, borders, accent, status, and priority.',
  },
  'radii-shadows': { title: 'Radius & shadows', note: 'Corner scale and elevation.' },
  typography: { title: 'Typography', note: 'UI type scale.' },
  brand: { title: 'Brand', note: 'Mark + wordmark.' },
  buttons: {
    title: 'Buttons',
    note: 'Shared Button — size · variant · negative · icon-only (Figma Components 26:7282).',
  },
  segmented: { title: 'Segmented', note: 'Exclusive choice controls — list/board, band/rule.' },
  chips: { title: 'Chips', note: 'Filter chips, status chips, and meta pills.' },
  kbd: { title: 'Kbd', note: 'Keyboard shortcut badges — always uppercase.' },
  tooltips: {
    title: 'Tooltips',
    note: 'Instant tips via data-tip + TipHost — hover / focus, viewport-clamped.',
  },
  inputs: { title: 'Inputs', note: 'Default, filled, read-only.' },
  status: { title: 'Status', note: 'Chips, icons, and circle checks in every state.' },
  priority: { title: 'Priority', note: 'Bars, labels, and NoneMark.' },
  'entity-icons': { title: 'Entity icons', note: 'Dot · emoji · Lucide key.' },
  progress: { title: 'Progress', note: 'Bar and ring.' },
  refs: { title: 'Refs & links', note: 'Copy interactions.' },
  navigation: { title: 'Navigation', note: 'Nav item states and section heads.' },
  icons: { title: 'Icons', note: 'Curated facade set (sample).' },
  switch: { title: 'Switch', note: 'Display-popover toggle.' },
  feedback: { title: 'Feedback', note: 'Toast and modal.' },
};

/** True when `value` is a known design-system section slug. */
export function isDsItemId(value: string): value is DsItemId {
  return (DS_ITEM_IDS as readonly string[]).includes(value);
}
