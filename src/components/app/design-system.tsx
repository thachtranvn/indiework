'use client';

/**
 * Design System gallery — left menu of token/component groups; each item
 * demos that piece in every state, with a desktop/mobile viewport toggle.
 */

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  TASK_STATUS,
  TASK_STATUS_LABEL,
  TASK_PRIORITY,
  TASK_PRIORITY_LABEL,
} from '@/lib/domain';
import {
  StatusChip,
  PriorityBars,
  EntityIcon,
  ModuleTag,
  MilestoneTag,
  DuePill,
  MetaPill,
  Progress,
  ProgressRing,
  PhaseIcon,
  CalendarIcon,
  NoneMark,
} from '@/components/ui/bits';
import { StatusIcon } from '@/components/ui/status-icon';
import { CircleCheck, RefTag, CopyLinkButton } from '@/components/ui/interactive';
import { BrandMark, Wordmark } from '@/components/ui/brand';
import { Ic } from '@/components/ui/icons';
import { Modal } from '@/components/ui/modal';
import { useFeedback } from '@/components/ui/toast';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Tip } from '@/components/ui/tooltip';
import { dueTooltip } from '@/lib/dates';
import { NavToggle } from './nav-toggle';
import {
  DS_ITEM_META,
  type DsItemId,
} from './design-system-nav';

type Viewport = 'desktop' | 'mobile';

type DsNavItem = { id: DsItemId; label: string };
type DsNavGroup = { label: string; items: DsNavItem[] };

const NAV: DsNavGroup[] = [
  {
    label: 'Tokens',
    items: [
      { id: 'colors-primitive', label: 'Colors: Primitive' },
      { id: 'colors-semantic', label: 'Colors: Semantic' },
      { id: 'colors-legacy', label: 'Colors: Legacy' },
      { id: 'radii-shadows', label: 'Radius & shadows' },
      { id: 'typography', label: 'Typography' },
    ],
  },
  {
    label: 'Components',
    items: [
      { id: 'brand', label: 'Brand' },
      { id: 'buttons', label: 'Buttons' },
      { id: 'segmented', label: 'Segmented' },
      { id: 'chips', label: 'Chips' },
      { id: 'kbd', label: 'Kbd' },
      { id: 'tooltips', label: 'Tooltips' },
      { id: 'inputs', label: 'Inputs' },
      { id: 'status', label: 'Status' },
      { id: 'priority', label: 'Priority' },
      { id: 'entity-icons', label: 'Entity icons' },
      { id: 'progress', label: 'Progress' },
      { id: 'refs', label: 'Refs & links' },
      { id: 'navigation', label: 'Navigation' },
      { id: 'icons', label: 'Icons' },
      { id: 'switch', label: 'Switch' },
      { id: 'feedback', label: 'Feedback' },
    ],
  },
];

type ColorToken = { name: string; description?: string; primitive?: string };

const SURFACE_COLORS: ColorToken[] = [
  { name: '--bg-app', description: 'Canvas behind floating panels' },
  { name: '--bg-canvas', description: 'Main panel surface' },
  { name: '--bg-surface', description: 'Raised surfaces — cards, popovers' },
  { name: '--bg-sunken', description: 'Inset wells and muted fills' },
  { name: '--bg-hover', description: 'Hover wash on interactive rows' },
  { name: '--bg-active', description: 'Selected / pressed state fill' },
];

const BORDER_COLORS: ColorToken[] = [
  { name: '--border', description: 'Default stroke' },
  { name: '--border-soft', description: 'Subtle dividers' },
  { name: '--border-strong', description: 'Stronger outline on focus/hover' },
];

const ACCENT_COLORS: ColorToken[] = [
  { name: '--accent', description: 'Brand blue — primary buttons, marks, links' },
  { name: '--accent-strong', description: 'Primary hover / pressed' },
  { name: '--accent-soft', description: 'Soft accent wash (neutral in light)' },
  { name: '--accent-softer', description: 'Quiet accent tint' },
  { name: '--accent-ink', description: 'Ink on accent surfaces' },
  { name: '--accent-ring', description: 'Focus ring' },
];

const STATUS_COLORS: ColorToken[] = [
  { name: '--st-inbox', description: 'Inbox mark' },
  { name: '--st-inbox-bg', description: 'Inbox chip wash' },
  { name: '--st-backlog', description: 'Backlog mark' },
  { name: '--st-backlog-bg', description: 'Backlog chip wash' },
  { name: '--st-todo', description: 'Todo / planned mark' },
  { name: '--st-todo-bg', description: 'Todo chip wash' },
  { name: '--st-in_progress', description: 'In progress mark' },
  { name: '--st-in_progress-bg', description: 'In progress chip wash' },
  { name: '--st-launching', description: 'Launching mark (project lifecycle)' },
  { name: '--st-launching-bg', description: 'Launching wash' },
  { name: '--st-in_review', description: 'In review mark' },
  { name: '--st-in_review-bg', description: 'In review chip wash' },
  { name: '--st-pending', description: 'Pending / waiting mark' },
  { name: '--st-pending-bg', description: 'Pending chip wash' },
  { name: '--st-done', description: 'Done mark' },
  { name: '--st-done-bg', description: 'Done chip wash' },
  { name: '--st-cancelled', description: 'Cancelled mark' },
  { name: '--st-cancelled-bg', description: 'Cancelled chip wash' },
  { name: '--st-danger', description: 'Danger / blocked' },
  { name: '--st-danger-bg', description: 'Danger wash' },
];

const PRIORITY_COLORS: ColorToken[] = [
  { name: '--pr-idle', description: 'Empty priority bar ticks' },
  { name: '--pr-none', description: 'No priority (aliases text-placeholder)' },
  { name: '--pr-low', description: 'Low' },
  { name: '--pr-medium', description: 'Medium' },
  { name: '--pr-high', description: 'High' },
  { name: '--pr-urgent', description: 'Urgent' },
];

const PRIMITIVE_SHADES = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Builds `--{scale}-{shade}` rows for a Foundations palette. */
function primitiveScaleTokens(scale: string, label: string): ColorToken[] {
  return PRIMITIVE_SHADES.map((shade) => ({
    name: `--${scale}-${shade}`,
    description: `${label} ${shade}`,
  }));
}

const PRIMITIVE_BASE: ColorToken[] = [
  { name: '--white', description: 'Base white' },
  { name: '--black', description: 'Base black' },
];

const PRIMITIVE_GRAY = primitiveScaleTokens('gray', 'Gray');
const PRIMITIVE_BRAND = primitiveScaleTokens('brand', 'Brand');
const PRIMITIVE_RED = primitiveScaleTokens('red', 'Red');
const PRIMITIVE_YELLOW = primitiveScaleTokens('yellow', 'Yellow');
const PRIMITIVE_GREEN = primitiveScaleTokens('green', 'Green');
const PRIMITIVE_MOSS = primitiveScaleTokens('moss', 'Moss');
const PRIMITIVE_TEAL = primitiveScaleTokens('teal', 'Teal');
const PRIMITIVE_CYAN = primitiveScaleTokens('cyan', 'Cyan');
const PRIMITIVE_BLUE = primitiveScaleTokens('blue', 'Blue');
const PRIMITIVE_VIOLET = primitiveScaleTokens('violet', 'Violet');
const PRIMITIVE_ROSE = primitiveScaleTokens('rose', 'Rose');
const PRIMITIVE_TAUPE = primitiveScaleTokens('taupe', 'Taupe');

const SEMANTIC_TEXT: ColorToken[] = [
  { name: '--text-primary', primitive: '--gray-900', description: 'text/text-primary' },
  { name: '--text-secondary', primitive: '--gray-700', description: 'text/text-secondary' },
  { name: '--text-tertiary', primitive: '--gray-600', description: 'text/text-tertiary' },
  { name: '--text-quaternary', primitive: '--gray-400', description: 'text/text-quaternary' },
  { name: '--text-placeholder', primitive: '--gray-500', description: 'text/text-placeholder' },
  { name: '--text-inverse', primitive: '--white', description: 'text/text-inverse' },
  { name: '--text-white', primitive: '--white', description: 'text/text-white' },
  { name: '--text-brand', primitive: '--brand-600', description: 'text/text-brand' },
  { name: '--text-error', primitive: '--red-600', description: 'text/text-error' },
  { name: '--text-success', primitive: '--green-600', description: 'text/text-success' },
  { name: '--text-warning', primitive: '--yellow-600', description: 'text/text-warning' },
  { name: '--text-disabled', primitive: '--gray-300', description: 'text/text-disabled' },
];

const SEMANTIC_FG: ColorToken[] = [
  { name: '--fg-primary', primitive: '--gray-900', description: 'foreground/fg-primary' },
  { name: '--fg-secondary', primitive: '--gray-700', description: 'foreground/fg-secondary' },
  { name: '--fg-tertiary', primitive: '--gray-600', description: 'foreground/fg-tertiary' },
  { name: '--fg-white', primitive: '--white', description: 'foreground/fg-white' },
  { name: '--fg-brand', primitive: '--brand-600', description: 'foreground/fg-brand' },
  { name: '--fg-negative', primitive: '--red-500', description: 'foreground/fg-negative' },
  { name: '--fg-positive', primitive: '--green-500', description: 'foreground/fg-positive' },
  { name: '--fg-warning', primitive: '--yellow-500', description: 'foreground/fg-warning' },
];

const SEMANTIC_BG: ColorToken[] = [
  { name: '--bg-primary', primitive: '--white', description: 'background/bg-primary' },
  { name: '--bg-secondary', primitive: '--gray-50', description: 'background/bg-secondary' },
  { name: '--bg-tertiary', primitive: '--gray-100', description: 'background/bg-tertiary' },
  { name: '--bg-quaternary', primitive: '--gray-200', description: 'background/bg-quaternary' },
  { name: '--bg-disabled', primitive: '--gray-100', description: 'background/bg-disabled' },
  { name: '--bg-neutral-inverse', primitive: '--gray-950', description: 'background/bg-neutral-inverse' },
  { name: '--bg-brand-primary', primitive: '--brand-50', description: 'background/bg-brand-primary' },
  { name: '--bg-brand-secondary', primitive: '--brand-100', description: 'background/bg-brand-secondary' },
  { name: '--bg-brand-solid', primitive: '--brand-600', description: 'background/bg-brand-solid' },
  { name: '--bg-negative-primary', primitive: '--red-50', description: 'background/bg-negative-primary' },
  { name: '--bg-negative-secondary', primitive: '--red-100', description: 'background/bg-negative-secondary' },
  { name: '--bg-negative-solid', primitive: '--red-500', description: 'background/bg-negative-solid' },
  { name: '--bg-positive-primary', primitive: '--green-50', description: 'background/bg-positive-primary' },
  { name: '--bg-positive-secondary', primitive: '--green-100', description: 'background/bg-positive-secondary' },
  { name: '--bg-positive-solid', primitive: '--green-500', description: 'background/bg-positive-solid' },
  { name: '--bg-warning-primary', primitive: '--yellow-50', description: 'background/bg-warning-primary' },
  { name: '--bg-warning-secondary', primitive: '--yellow-100', description: 'background/bg-warning-secondary' },
  { name: '--bg-warning-solid', primitive: '--yellow-500', description: 'background/bg-warning-solid' },
];

const SEMANTIC_OUTLINE: ColorToken[] = [
  { name: '--outline-primary', primitive: '--gray-200', description: 'outline/outline-primary' },
  { name: '--outline-secondary', primitive: '--gray-200', description: 'outline/outline-secondary' },
  { name: '--outline-tertiary', primitive: '--gray-300', description: 'outline/outline-tertiary' },
  { name: '--outline-disabled', primitive: '--gray-200', description: 'outline/outline-disabled' },
  { name: '--outline-brand-primary', primitive: '--brand-200', description: 'outline/outline-brand-primary' },
  { name: '--outline-brand-secondary', primitive: '--brand-300', description: 'outline/outline-brand-secondary' },
  { name: '--outline-negative-primary', primitive: '--red-200', description: 'outline/outline-negative-primary' },
  { name: '--outline-negative-secondary', primitive: '--red-300', description: 'outline/outline-negative-secondary' },
  { name: '--outline-positive-primary', primitive: '--green-300', description: 'outline/outline-positive-primary' },
  { name: '--outline-positive-secondary', primitive: '--green-400', description: 'outline/outline-positive-secondary' },
  { name: '--outline-warning-primary', primitive: '--yellow-300', description: 'outline/outline-warning-primary' },
  { name: '--outline-warning-secondary', primitive: '--yellow-400', description: 'outline/outline-warning-secondary' },
];

const RADIUS_TOKENS = ['--r-xs', '--r-sm', '--r-md', '--r-lg', '--r-xl', '--r-pill'] as const;
const SHADOW_TOKENS = ['--shadow-sm', '--shadow-md', '--shadow-lg'] as const;

const ICON_SAMPLES = [
  'list',
  'board',
  'inbox',
  'plus',
  'settings',
  'search',
  'sparkle',
  'layers',
  'target',
  'chevronLeft',
  'chevronUp',
  'chevronDown',
  'chevronSelectorVertical',
  'dotsHorizontal',
  'pin',
  'pinSolid',
  'filter',
  'sliders',
  'link',
  'expand',
  'trash',
  'key',
  'bolt',
] as const satisfies ReadonlyArray<keyof typeof Ic>;

/** Standalone Design System screen (route: /app/design-system/[section]). */
export function DesignSystemScreen({ section }: { section: DsItemId }) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const meta = DS_ITEM_META[section];

  return (
    <div className="settings">
      <nav className="settings-nav ds-nav">
        <NavToggle />
        <div className="settings-navlabel">Design System</div>
        {NAV.map((group) => (
          <div className="ds-nav-group" key={group.label}>
            <div className="ds-nav-grouplabel">{group.label}</div>
            {group.items.map(({ id, label }) => (
              <Link
                key={id}
                className="settings-navitem"
                href={`/app/design-system/${id}`}
                data-active={section === id ? '' : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="settings-main ds-main">
        <div className="settings-pane ds-pane">
          <div className="settings-head-row">
            <div>
              <h1 className="settings-h">{meta.title}</h1>
              <p className="settings-sub">{meta.note}</p>
            </div>
            <ViewportToggle viewport={viewport} onChange={setViewport} />
          </div>
          <DemoFrame key={section} viewport={viewport}>
            <ItemDemo id={section} viewport={viewport} onViewportChange={setViewport} />
          </DemoFrame>
        </div>
      </div>
    </div>
  );
}

/** Viewport-framed demo surface. */
function DemoFrame({ viewport, children }: { viewport: Viewport; children: ReactNode }) {
  return (
    <div className="ds-frame" data-viewport={viewport}>
      {viewport === 'mobile' && <div className="ds-phone-notch" aria-hidden />}
      {children}
    </div>
  );
}

/** Renders demos for the selected menu item. */
function ItemDemo({
  id,
  viewport,
  onViewportChange,
}: {
  id: DsItemId;
  viewport: Viewport;
  onViewportChange: (v: Viewport) => void;
}) {
  switch (id) {
    case 'colors-primitive':
      return <PrimitiveColorsDemo />;
    case 'colors-semantic':
      return <SemanticColorsDemo />;
    case 'colors-legacy':
      return <LegacyColorsDemo />;
    case 'radii-shadows':
      return <RadiiShadowsDemo />;
    case 'typography':
      return <TypographyDemo />;
    case 'brand':
      return <BrandDemo />;
    case 'buttons':
      return <ButtonsDemo />;
    case 'segmented':
      return <SegmentedDemo />;
    case 'chips':
      return <ChipsDemo />;
    case 'kbd':
      return <KbdDemo />;
    case 'tooltips':
      return <TooltipsDemo />;
    case 'inputs':
      return <InputsDemo />;
    case 'status':
      return <StatusDemo />;
    case 'priority':
      return <PriorityDemo />;
    case 'entity-icons':
      return <EntityIconsDemo />;
    case 'progress':
      return <ProgressDemo />;
    case 'refs':
      return <RefsDemo />;
    case 'navigation':
      return <NavigationDemo />;
    case 'icons':
      return <IconsDemo />;
    case 'switch':
      return <SwitchDemo viewport={viewport} onViewportChange={onViewportChange} />;
    case 'feedback':
      return <FeedbackDemo />;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function PrimitiveColorsDemo() {
  return (
    <div className="ds-stack">
      <Section title="Base" note="Main · white / black">
        <ColorTable tokens={PRIMITIVE_BASE} />
      </Section>
      <Section title="Gray" note="Main · neutral scale">
        <ColorTable tokens={PRIMITIVE_GRAY} />
      </Section>
      <Section title="Brand" note="Main · primary interactive">
        <ColorTable tokens={PRIMITIVE_BRAND} />
      </Section>
      <Section title="Red" note="Semantic">
        <ColorTable tokens={PRIMITIVE_RED} />
      </Section>
      <Section title="Yellow" note="Semantic">
        <ColorTable tokens={PRIMITIVE_YELLOW} />
      </Section>
      <Section title="Green" note="Semantic">
        <ColorTable tokens={PRIMITIVE_GREEN} />
      </Section>
      <Section title="Moss" note="Utility">
        <ColorTable tokens={PRIMITIVE_MOSS} />
      </Section>
      <Section title="Teal" note="Utility">
        <ColorTable tokens={PRIMITIVE_TEAL} />
      </Section>
      <Section title="Cyan" note="Utility">
        <ColorTable tokens={PRIMITIVE_CYAN} />
      </Section>
      <Section title="Blue" note="Utility">
        <ColorTable tokens={PRIMITIVE_BLUE} />
      </Section>
      <Section title="Violet" note="Utility">
        <ColorTable tokens={PRIMITIVE_VIOLET} />
      </Section>
      <Section title="Rose" note="Utility">
        <ColorTable tokens={PRIMITIVE_ROSE} />
      </Section>
      <Section title="Taupe" note="Utility">
        <ColorTable tokens={PRIMITIVE_TAUPE} />
      </Section>
    </div>
  );
}

function SemanticColorsDemo() {
  return (
    <div className="ds-stack">
      <Section title="Text" note="text/*">
        <ColorTable tokens={SEMANTIC_TEXT} showPrimitive />
      </Section>
      <Section title="Foreground" note="foreground/* — icons / marks">
        <ColorTable tokens={SEMANTIC_FG} showPrimitive />
      </Section>
      <Section title="Background" note="background/*">
        <ColorTable tokens={SEMANTIC_BG} showPrimitive />
      </Section>
      <Section title="Outline" note="outline/*">
        <ColorTable tokens={SEMANTIC_OUTLINE} showPrimitive />
      </Section>
    </div>
  );
}

function LegacyColorsDemo() {
  return (
    <div className="ds-stack">
      <Section title="Surfaces" note="Background tokens">
        <ColorTable tokens={SURFACE_COLORS} />
      </Section>
      <Section title="Borders" note="Stroke tokens">
        <ColorTable tokens={BORDER_COLORS} />
      </Section>
      <Section title="Accent" note="Brand + focus">
        <ColorTable tokens={ACCENT_COLORS} />
      </Section>
      <Section title="Status palette" note="Task / project lifecycle colors">
        <ColorTable tokens={STATUS_COLORS} />
      </Section>
      <Section title="Priority palette" note="Task urgency colors">
        <ColorTable tokens={PRIORITY_COLORS} />
      </Section>
    </div>
  );
}

function RadiiShadowsDemo() {
  return (
    <div className="ds-stack">
      <Section title="Radius" note="Scaled by --radius-scale">
        <div className="ds-row wrap">
          {RADIUS_TOKENS.map((token) => (
            <div className="ds-radius-card" key={token}>
              <span className="ds-radius-sample" style={{ borderRadius: `var(${token})` }} />
              <code className="ds-token">{token}</code>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Shadows" note="Elevation">
        <div className="ds-row wrap">
          {SHADOW_TOKENS.map((token) => (
            <div className="ds-shadow-card" key={token} style={{ boxShadow: `var(${token})` }}>
              <code className="ds-token">{token}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function TypographyDemo() {
  return (
    <div className="ds-type">
      <h1 className="settings-h">Heading 20 / 700</h1>
      <p className="settings-sub" style={{ marginBottom: 8 }}>
        Subcopy 13.5 — muted supporting sentence for context.
      </p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>Body primary</p>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-quaternary)' }}>Quaternary 12.5</p>
      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-placeholder)' }}>Placeholder 11.5</p>
      <code className="ds-token">Mono — IBM Plex / --font-mono</code>
    </div>
  );
}

function BrandDemo() {
  return (
    <div className="ds-row">
      <BrandMark size={40} />
      <BrandMark size={28} />
      <Wordmark />
    </div>
  );
}

function ButtonsDemo() {
  const sizes: ButtonSize[] = ['md', 'sm', 'xs'];
  const variants: ButtonVariant[] = ['accent', 'primary', 'secondary', 'tertiary', 'inline'];
  const sampleIcon = <Ic.plus />;

  return (
    <div className="ds-stack">
      <Section title="Sizes" note="Default sm · md 44 / icon 24 · sm 36 / icon 20 · xs 28 / icon 16">
        <div className="ds-row wrap">
          {sizes.map((size) => (
            <Button key={size} size={size} variant="primary" leftIcon={sampleIcon}>
              {size === 'md' ? 'Medium 44' : size === 'sm' ? 'Small 36' : 'Extra Small 28'}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Content" note="Left icon · right icon · label only">
        <div className="ds-row wrap">
          <Button variant="primary" leftIcon={sampleIcon}>
            Left Icon
          </Button>
          <Button variant="primary" rightIcon={sampleIcon}>
            Right Icon
          </Button>
          <Button variant="primary">Label Only</Button>
        </div>
      </Section>

      <Section title="Variants" note="accent · primary · secondary · tertiary · inline">
        <div className="ds-row wrap">
          {variants.map((variant) => (
            <Button key={variant} variant={variant} leftIcon={sampleIcon}>
              {variant[0]!.toUpperCase() + variant.slice(1)}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Disabled">
        <div className="ds-row wrap">
          {variants.map((variant) => (
            <Button key={variant} variant={variant} leftIcon={sampleIcon} disabled>
              Disabled
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Negative" note="Destructive / danger tone">
        <div className="ds-row wrap">
          {variants.map((variant) => (
            <Button key={variant} variant={variant} negative leftIcon={sampleIcon}>
              Negative
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Icon only" note="Circular — icons md 24 · sm 20 · xs 16">
        <div className="ds-stack">
          {variants.map((variant) => (
            <div className="ds-row wrap" key={variant}>
              {sizes.map((size) => (
                <Button
                  key={size}
                  size={size}
                  variant={variant}
                  iconOnly
                  leftIcon={sampleIcon}
                  aria-label={`${variant} ${size}`}
                />
              ))}
              <Button
                size="md"
                variant={variant}
                negative
                iconOnly
                leftIcon={sampleIcon}
                aria-label={`${variant} negative`}
              />
              <Button
                size="md"
                variant={variant}
                iconOnly
                leftIcon={sampleIcon}
                disabled
                aria-label={`${variant} disabled`}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Toolbar chrome" note="Shared Button + layout classes (tabs-sb-toggle, icon-tool)">
        <div className="ds-row wrap ds-btn-force">
          <Button
            className="tabs-sb-toggle"
            type="button"
            iconOnly
            size="xs"
            variant="tertiary"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
            leftIcon={<Ic.sidebar size={16} />}
          />
          <Button
            className="icon-tool"
            type="button"
            iconOnly
            size="xs"
            variant="tertiary"
            aria-label="Filter"
            leftIcon={<Ic.filter size={16} />}
          />
          <Button
            className="icon-tool"
            type="button"
            iconOnly
            size="xs"
            variant="tertiary"
            data-on=""
            aria-label="Display"
            leftIcon={<Ic.sliders size={16} />}
          >
            <span className="tool-dot" />
          </Button>
          <Button type="button" iconOnly size="xs" variant="tertiary" title="More" aria-label="More" leftIcon={<Ic.dots size={16} />} />
          <NavToggle />
        </div>
      </Section>
    </div>
  );
}

function SegmentedDemo() {
  return (
    <div className="ds-stack">
      <Section title="Toolbar segment" note=".tool-seg — exclusive mode switch">
        <div className="tool-seg">
          <button type="button" data-active="">
            <Ic.list size={14} /> List
          </button>
          <button type="button">
            <Ic.board size={14} /> Board
          </button>
        </div>
      </Section>
      <Section title="Segment buttons" note=".seg-btn — display popover choices">
        <div className="ds-row wrap">
          <button className="seg-btn" type="button" data-active="">
            <Ic.list size={14} /> List
          </button>
          <button className="seg-btn" type="button">
            <Ic.board size={14} /> Board
          </button>
          <button className="seg-btn" type="button">
            Band
          </button>
          <button className="seg-btn" type="button" data-active="">
            Rule
          </button>
        </div>
      </Section>
    </div>
  );
}

function ChipsDemo() {
  return (
    <div className="ds-stack">
      <Section title="Filter chips" note=".fchip — multi-select filters">
        <div className="ds-row wrap">
          <button className="fchip" type="button">
            Todo
          </button>
          <button className="fchip" type="button" data-on="">
            In progress
          </button>
          <button className="fchip" type="button">
            Review
          </button>
          <button className="fchip" type="button" data-on="">
            High
          </button>
          <button className="fchip" type="button">
            Urgent
          </button>
        </div>
      </Section>
      <Section title="Status chips" note=".chip.st-chip — read-only status marks">
        <div className="ds-row wrap">
          {TASK_STATUS.map((s) => (
            <StatusChip key={s} status={s} />
          ))}
        </div>
      </Section>
      <Section title="Status chips · sm">
        <div className="ds-row wrap">
          {TASK_STATUS.map((s) => (
            <StatusChip key={`sm-${s}`} status={s} size="sm" />
          ))}
        </div>
      </Section>
      <Section title="Meta pills" note="Empty · hover · selected (forced for gallery)">
        <div className="ds-meta-states">
          <div className="ds-meta-states-head" aria-hidden>
            <span />
            <span>Empty</span>
            <span>Hover</span>
            <span>Selected</span>
          </div>
          <div className="ds-meta-states-row">
            <span className="ds-muted">Module</span>
            <MetaPill icon={<EntityIcon icon="cube" color="#2b7fff" size={14} />} label="Set module" className="meta-pill-ghost" />
            <span className="task-meta-btn" data-hover="">
              <ModuleTag name="Auth" color="#2b7fff" icon="lock" />
            </span>
            <ModuleTag name="Auth" color="#2b7fff" icon="lock" />
          </div>
          <div className="ds-meta-states-row">
            <span className="ds-muted">Milestone</span>
            <MetaPill icon={<PhaseIcon />} label="Set milestone" className="meta-pill-ghost" />
            <span className="task-meta-btn" data-hover="">
              <MilestoneTag name="v1 Launch · Apr" />
            </span>
            <MilestoneTag name="v1 Launch · Apr" />
          </div>
          <div className="ds-meta-states-row">
            <span className="ds-muted">Due</span>
            <MetaPill icon={<CalendarIcon />} label="Set due" className="meta-pill-ghost" />
            <span className="task-due-btn" data-hover="">
              <DuePill due={new Date(Date.now() + 10 * 86_400_000)} />
            </span>
            <DuePill due={new Date(Date.now() + 10 * 86_400_000)} />
          </div>
        </div>
      </Section>
      <Section title="Meta pills · variants" note="Due urgency + complete">
        <div className="ds-row wrap">
          <DuePill due={new Date()} />
          <DuePill due={new Date(Date.now() + 86_400_000)} />
          <DuePill due={new Date(Date.now() - 86_400_000)} />
          <DuePill due={new Date()} muted />
          <ModuleTag name="No module" faint />
          <MetaPill label="Complete" className="meta-pill-complete" />
        </div>
      </Section>
    </div>
  );
}

function InputsDemo() {
  return (
    <div className="ds-stack">
      <input className="set-input" placeholder="Placeholder" defaultValue="" />
      <input className="set-input" defaultValue="Filled value" />
      <input className="set-input" defaultValue="Read-only" readOnly />
    </div>
  );
}

function StatusDemo() {
  return (
    <div className="ds-stack">
      <Section title="Chips · md" note="All task statuses">
        <div className="ds-row wrap">
          {TASK_STATUS.map((s) => (
            <StatusChip key={s} status={s} />
          ))}
        </div>
      </Section>
      <Section title="Chips · sm">
        <div className="ds-row wrap">
          {TASK_STATUS.map((s) => (
            <StatusChip key={`sm-${s}`} status={s} size="sm" />
          ))}
        </div>
      </Section>
      <Section title="Chips · no dot">
        <div className="ds-row wrap">
          {TASK_STATUS.map((s) => (
            <StatusChip key={`nodot-${s}`} status={s} showDot={false} />
          ))}
        </div>
      </Section>
      <Section title="Status icons">
        <div className="ds-row wrap">
          {TASK_STATUS.map((s) => (
            <div className="ds-icon-cell" key={s} title={TASK_STATUS_LABEL[s]}>
              <StatusIcon status={s} size={18} />
              <span>{TASK_STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Circle check" note="Passive + interactive">
        <div className="ds-row wrap">
          {TASK_STATUS.map((s) => (
            <CircleCheck key={s} status={s} done={s === 'done'} size={18} />
          ))}
          <CircleCheck status="todo" done={false} size={18} onToggle={() => undefined} />
          <CircleCheck status="todo" done size={18} onToggle={() => undefined} />
        </div>
      </Section>
    </div>
  );
}

function PriorityDemo() {
  return (
    <div className="ds-stack">
      <div className="ds-row wrap">
        {TASK_PRIORITY.map((p) => (
          <div className="ds-icon-cell" key={p}>
            <PriorityBars priority={p} />
            <span>{TASK_PRIORITY_LABEL[p]}</span>
          </div>
        ))}
      </div>
      <div className="ds-row wrap">
        {TASK_PRIORITY.map((p) => (
          <PriorityBars key={`lbl-${p}`} priority={p} showLabel />
        ))}
      </div>
      <div className="ds-row">
        <NoneMark />
        <span className="ds-muted">NoneMark</span>
      </div>
    </div>
  );
}

function EntityIconsDemo() {
  return (
    <div className="ds-row wrap">
      <EntityIcon color="#3FB984" size={16} />
      <EntityIcon icon="🚀" color="#3FB984" size={16} />
      <EntityIcon icon="cube" color="#2b7fff" size={16} />
      <EntityIcon icon="layers" color="#a684ff" size={16} />
      <EntityIcon icon="sparkle" color="#fdc800" size={16} />
      <EntityIcon icon="bolt" color="#ff6467" size={16} />
    </div>
  );
}

function ProgressDemo() {
  return (
    <div className="ds-row wrap">
      <Progress value={0} />
      <Progress value={0.35} />
      <Progress value={0.7} />
      <Progress value={1} tone="done" />
      <ProgressRing value={0} />
      <ProgressRing value={0.4} />
      <ProgressRing value={0.85} />
      <ProgressRing value={1} />
    </div>
  );
}

function RefsDemo() {
  return (
    <div className="ds-row wrap">
      <RefTag value="IW-15" />
      <RefTag value="IW-3" big />
      <CopyLinkButton getUrl={() => (typeof window !== 'undefined' ? window.location.href : null)} />
    </div>
  );
}

function NavigationDemo() {
  return (
    <div className="ds-stack">
      <Section title="Nav items" note="Selected · Hover · Idle — semantic tokens">
        <div className="ds-nav-demo">
          <div className="nav-item" data-active="">
            <span className="nav-icon">
              <Ic.cube size={16} />
            </span>
            <span className="nav-label">Title - Selected</span>
            <span className="nav-badge">3</span>
          </div>
          <div className="nav-item" data-hover="">
            <span className="nav-icon">
              <Ic.cube size={16} />
            </span>
            <span className="nav-label">Title - Hovering</span>
            <span className="nav-badge">12</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">
              <Ic.cube size={16} />
            </span>
            <span className="nav-label">Title - Idle</span>
            <span className="nav-badge">99+</span>
          </div>
        </div>
      </Section>
      <Section title="Section heads" note="Label + chevron · optional tertiary plus">
        <div className="ds-nav-demo">
          <div className="sb-section">
            <div className="sb-section-inner">
              <button className="sb-section-toggle" type="button">
                <span className="sb-section-label">Projects</span>
                <span className="sb-section-caret" aria-hidden>
                  <Ic.chevronDown size={14} />
                </span>
              </button>
              <Button
                type="button"
                iconOnly
                size="xs"
                variant="tertiary"
                aria-label="New project"
                leftIcon={<Ic.plus size={16} />}
              />
            </div>
          </div>
          <div className="sb-section">
            <div className="sb-section-inner">
              <button className="sb-section-toggle" type="button" data-collapsed="">
                <span className="sb-section-label">Pinned</span>
                <span className="sb-section-caret" aria-hidden>
                  <Ic.chevronDown size={14} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function IconsDemo() {
  return (
    <div className="ds-row wrap">
      {ICON_SAMPLES.map((name) => {
        const Icon = Ic[name];
        return (
          <div className="ds-icon-cell" key={name}>
            <Icon size={18} />
            <span>{name}</span>
          </div>
        );
      })}
    </div>
  );
}

function SwitchDemo({
  viewport,
  onViewportChange,
}: {
  viewport: Viewport;
  onViewportChange: (v: Viewport) => void;
}) {
  const isMobile = viewport === 'mobile';
  return (
    <div className="ds-stack">
      <button
        className="dp-toggle"
        type="button"
        onClick={() => onViewportChange(isMobile ? 'desktop' : 'mobile')}
      >
        Mobile preview
        <span className="dp-switch" data-on={isMobile ? '' : undefined} />
      </button>
      <button className="dp-toggle" type="button">
        Off
        <span className="dp-switch" />
      </button>
      <button className="dp-toggle" type="button">
        On
        <span className="dp-switch" data-on="" />
      </button>
    </div>
  );
}

function KbdDemo() {
  return (
    <div className="ds-stack">
      <Section title="Keys" note="<Kbd /> — letter, chord, and special keys">
        <div className="ds-row wrap">
          <Kbd>c</Kbd>
          <Kbd>⌘K</Kbd>
          <Kbd>esc</Kbd>
          <Kbd>↵</Kbd>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
        </div>
      </Section>
      <Section title="In context" note="Sidebar search + quick capture">
        <div className="ds-stack">
          <button className="sb-search" type="button" style={{ maxWidth: 230 }}>
            <Ic.search size={15} />
            <span>Search</span>
            <Kbd>⌘K</Kbd>
          </button>
          <div className="qcap" style={{ margin: 0, maxWidth: 320 }}>
            <div className="qcap-inner">
              <span className="qcap-plus">
                <Ic.plus size={16} />
              </span>
              <input readOnly placeholder="Add task..." />
              <Kbd className="qcap-hint">c</Kbd>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

/** Tip chrome samples + live data-tip triggers (needs TipHost in the shell). */
function TooltipsDemo() {
  const sampleDue = new Date(Date.now() + 5 * 86_400_000);
  const sampleDueTip = dueTooltip(sampleDue);

  return (
    <div className="ds-stack">
      <Section title="Appearance" note="<Tip /> — forced-visible bubble chrome">
        <div className="ds-row wrap" style={{ alignItems: 'center', gap: 12 }}>
          <Tip>Short tip</Tip>
          <Tip>Due Jul 18, 2026 · in 5 days</Tip>
          <Tip>Rename</Tip>
        </div>
      </Section>
      <Section title="Hover / focus" note="Put data-tip on any control — TipHost portals + clamps">
        <div className="ds-row wrap">
          <Button size="sm" variant="secondary" data-tip="Save changes">
            Hover me
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            iconOnly
            leftIcon={<Ic.filter />}
            aria-label="Filter"
            data-tip="Filter"
          />
          <Button
            size="sm"
            variant="tertiary"
            iconOnly
            leftIcon={<Ic.sliders />}
            aria-label="Display"
            data-tip="Display"
          />
          <button className="task-pri-btn" type="button" data-tip="Priority: High" aria-label="Priority: High">
            <PriorityBars priority="high" />
          </button>
          <button
            className="task-status-btn"
            type="button"
            data-tip="Status: In progress"
            aria-label="Status: In progress"
          >
            <CircleCheck status="in_progress" done={false} size={18} />
          </button>
        </div>
      </Section>
      <Section title="In context" note="Same pattern as task-row meta pills">
        <div className="ds-row wrap">
          <MetaPill
            icon={<EntityIcon icon="cube" color="#2b7fff" size={14} />}
            label="Auth"
            title="Module: Auth"
          />
          <MetaPill icon={<PhaseIcon />} label="v1 Launch · Apr" title="Milestone: v1 Launch · Apr" />
          <span data-tip={sampleDueTip ?? undefined} aria-label={sampleDueTip ?? undefined}>
            <DuePill due={sampleDue} />
          </span>
        </div>
      </Section>
    </div>
  );
}

function FeedbackDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const feedback = useFeedback();
  return (
    <>
      <div className="ds-row wrap">
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => feedback.notify({ kind: 'info', message: 'Info toast sample.' })}
        >
          Info toast
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => feedback.notify({ kind: 'success', message: 'Saved successfully.' })}
        >
          Success toast
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => feedback.notifyError('Something went wrong.', () => undefined)}
        >
          Error toast
        </Button>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Open modal
        </Button>
      </div>
      {modalOpen && (
        <Modal
          title="Sample modal"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="tertiary" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setModalOpen(false)}>
                Confirm
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>
            Modal body — used for confirms, forms, and focused flows.
          </p>
        </Modal>
      )}
    </>
  );
}

/** Desktop / mobile viewport switch for the gallery frame. */
function ViewportToggle({
  viewport,
  onChange,
}: {
  viewport: Viewport;
  onChange: (v: Viewport) => void;
}) {
  return (
    <div className="ds-viewport-toggle" role="group" aria-label="Preview viewport">
      <button
        className="ds-vp-btn"
        type="button"
        data-on={viewport === 'desktop' ? '' : undefined}
        onClick={() => onChange('desktop')}
      >
        <Ic.maximize size={14} /> Desktop
      </button>
      <button
        className="ds-vp-btn"
        type="button"
        data-on={viewport === 'mobile' ? '' : undefined}
        onClick={() => onChange('mobile')}
      >
        <Ic.sliders size={14} /> Mobile
      </button>
    </div>
  );
}

/** Color token table: swatch · variable · [primitive] · hex · description. */
function ColorTable({
  tokens,
  showPrimitive = false,
}: {
  tokens: readonly ColorToken[];
  showPrimitive?: boolean;
}) {
  return (
    <div className="ds-color-table" role="table" data-primitive={showPrimitive ? '' : undefined}>
      <div className="ds-color-head" role="row">
        <span role="columnheader">Swatch</span>
        <span role="columnheader">Variable</span>
        {showPrimitive && <span role="columnheader">Primitive</span>}
        <span role="columnheader">Value</span>
        <span role="columnheader">Description</span>
      </div>
      {tokens.map((token) => (
        <ColorRow key={token.name} token={token} showPrimitive={showPrimitive} />
      ))}
    </div>
  );
}

/** One color token row; resolves the live computed value to hex. */
function ColorRow({ token, showPrimitive }: { token: ColorToken; showPrimitive: boolean }) {
  const hex = useResolvedCssColor(token.name);
  return (
    <div className="ds-color-row" role="row">
      <span className="ds-color-swatch-cell" role="cell">
        <span className="ds-swatch" style={{ background: `var(${token.name})` }} />
      </span>
      <code className="ds-color-var" role="cell">
        {token.name}
      </code>
      {showPrimitive && (
        <code className="ds-color-primitive" role="cell">
          {token.primitive ?? '—'}
        </code>
      )}
      <code className="ds-color-hex" role="cell">
        {hex}
      </code>
      <span className="ds-color-desc" role="cell">
        {token.description ?? '—'}
      </span>
    </div>
  );
}

/** Reads `var(--token)` from the live theme and formats as #RRGGBB. */
function useResolvedCssColor(token: string): string {
  const [value, setValue] = useState('—');
  useEffect(() => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${token})`;
    probe.style.position = 'fixed';
    probe.style.left = '-9999px';
    probe.style.width = '1px';
    probe.style.height = '1px';
    document.body.appendChild(probe);
    const raw = getComputedStyle(probe).backgroundColor;
    probe.remove();

    // Canvas forces sRGB so oklch/lab/color-mix always serialize as hex.
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setValue(cssColorToHex(raw) ?? raw);
      return;
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const hex = [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
    setValue(a < 255 ? `#${hex}${a.toString(16).padStart(2, '0').toUpperCase()}` : `#${hex}`);
  }, [token]);
  return value;
}

/** Converts `rgb()` / `rgba()` from getComputedStyle into #RRGGBB[AA]. */
function cssColorToHex(css: string): string | null {
  const comma = css.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  );
  const space = css.match(
    /rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i,
  );
  const m = comma ?? space;
  if (!m) return null;
  const r = Math.round(Number(m[1]));
  const g = Math.round(Number(m[2]));
  const b = Math.round(Number(m[3]));
  const a = m[4] === undefined ? 1 : Number(m[4]);
  const hex = [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
  if (a < 1) {
    return `#${hex}${Math.round(a * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()}`;
  }
  return `#${hex}`;
}

/** Section wrapper with title + optional note. */
function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="ds-section">
      <header className="ds-section-head">
        <h2 className="ds-section-title">{title}</h2>
        {note && <p className="ds-section-note">{note}</p>}
      </header>
      {children}
    </section>
  );
}
