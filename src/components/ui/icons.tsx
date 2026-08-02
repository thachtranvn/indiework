/**
 * Icon facade over lucide-react. The design spec is a 24-grid, ~1.7px rounded
 * stroke, currentColor set — Lucide matches it closely (per the handoff, an
 * approved substitute for the prototype's hand-drawn set). One place to keep
 * stroke width + names consistent with the design vocabulary.
 */
import {
  List,
  Columns3,
  Inbox,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  Flag,
  Calendar,
  Search,
  SlidersHorizontal,
  Copy,
  Trash2,
  MoreHorizontal,
  Settings,
  Sun,
  Moon,
  ArrowRight,
  ArrowUp,
  Target,
  Layers,
  Box,
  EyeOff,
  Lock,
  Sparkles,
  Globe,
  Link,
  Zap,
  GripVertical,
  Pin,
  Tag,
  Pencil,
  Table,
  KeyRound,
  Folder,
  Eye,
  ArrowLeft,
  ListFilter,
  ListChecks,
  ListTree,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  CornerDownRight,
  Baseline,
  Archive,
  ArchiveRestore,
  Maximize2,
  LogOut,
  CircleAlert,
  LoaderCircle,
  type LucideProps,
} from 'lucide-react';

type IconProps = Omit<LucideProps, 'ref'> & { size?: number };

const make =
  (Cmp: React.ComponentType<LucideProps>) =>
  ({ size = 18, strokeWidth = 1.7, ...rest }: IconProps) => (
    <Cmp size={size} strokeWidth={strokeWidth} absoluteStrokeWidth {...rest} />
  );

/** Filled sidebar toggle from the redesign (Figma sidebar-off). */
function SidebarIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <g transform="translate(0.667 2.667)">
        <path d="M12 9.33333V10.6667H2.66667V9.33333H12ZM13.3333 8V2.66667C13.3333 1.93029 12.7364 1.33333 12 1.33333H2.66667C1.93029 1.33333 1.33333 1.93029 1.33333 2.66667V8C1.33333 8.73638 1.93029 9.33333 2.66667 9.33333V10.6667C1.19391 10.6667 0 9.47276 0 8V2.66667C0 1.19391 1.19391 4.29504e-08 2.66667 0H12L12.1374 0.00325521C13.5463 0.0747431 14.6667 1.23998 14.6667 2.66667V8L14.6634 8.13737C14.5942 9.5008 13.5008 10.5942 12.1374 10.6634L12 10.6667V9.33333C12.7364 9.33333 13.3333 8.73638 13.3333 8Z" />
        <path d="M2 2.66667C2 2.29848 2.29848 2 2.66667 2H4.66667C5.03486 2 5.33333 2.29848 5.33333 2.66667V8C5.33333 8.36819 5.03486 8.66667 4.66667 8.66667H2.66667C2.29848 8.66667 2 8.36819 2 8V2.66667Z" />
      </g>
    </svg>
  );
}

export const Ic = {
  list: make(List),
  board: make(Columns3),
  inbox: make(Inbox),
  plus: make(Plus),
  close: make(X),
  chevronDown: make(ChevronDown),
  chevronRight: make(ChevronRight),
  chevronUp: make(ChevronUp),
  check: make(Check),
  flag: make(Flag),
  calendar: make(Calendar),
  search: make(Search),
  filter: make(SlidersHorizontal),
  sliders: make(SlidersHorizontal),
  filterFunnel: make(ListFilter),
  listChecks: make(ListChecks),
  copy: make(Copy),
  trash: make(Trash2),
  dots: make(MoreHorizontal),
  eye: make(Eye),
  arrowLeft: make(ArrowLeft),
  settings: make(Settings),
  sun: make(Sun),
  moon: make(Moon),
  arrowRight: make(ArrowRight),
  arrowUp: make(ArrowUp),
  target: make(Target),
  layers: make(Layers),
  cube: make(Box),
  eyeOff: make(EyeOff),
  lock: make(Lock),
  sparkle: make(Sparkles),
  globe: make(Globe),
  link: make(Link),
  bolt: make(Zap),
  grip: make(GripVertical),
  pin: make(Pin),
  tag: make(Tag),
  edit: make(Pencil),
  table: make(Table),
  key: make(KeyRound),
  folder: make(Folder),
  listTree: make(ListTree),
  paperclip: make(Paperclip),
  fileText: make(FileText),
  image: make(ImageIcon),
  download: make(Download),
  cornerDownRight: make(CornerDownRight),
  type: make(Baseline),
  archive: make(Archive),
  restore: make(ArchiveRestore),
  maximize: make(Maximize2),
  logout: make(LogOut),
  alert: make(CircleAlert),
  loader: make(LoaderCircle),
  sidebar: SidebarIcon,
};

export type IconName = keyof typeof Ic;

/** Resolve an icon by string key (e.g. a module's `icon`), with a fallback. */
export function iconByName(name: string | null | undefined, fallback: IconName = 'cube') {
  return (name && name in Ic ? Ic[name as IconName] : Ic[fallback]);
}

/**
 * A stored icon value is either an emoji glyph or a Lucide key — the two spaces
 * are disjoint, so we infer the kind from the value (no discriminator column).
 * Lucide names (facade keys + canonical kebab names) are lowercase ASCII words;
 * anything else (🚀, ◈, …) is an emoji/glyph to render verbatim.
 */
export function isEmojiValue(value: string | null | undefined): boolean {
  return !!value && !/^[a-z0-9-]+$/.test(value);
}
