/**
 * Icon facade over lucide-react + a few Figma Icons (Redesign § Icon).
 * Lucide: 24-grid, ~1.7px rounded stroke. Custom: filled currentColor from Figma.
 */
import {
  List,
  Columns3,
  Inbox,
  Plus,
  X,
  ChevronRight,
  Check,
  Flag,
  Calendar,
  Search,
  SlidersHorizontal,
  Copy,
  Trash2,
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

/** Shared props for Figma-sourced filled icons (24 viewBox). */
type FigmaIconProps = { size?: number; className?: string };

/** Filled sidebar toggle from the redesign (Figma sidebar-off). */
function SidebarIcon({ size = 16, className }: FigmaIconProps) {
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

/** Figma Icons · chevron-left (55:2298). */
function ChevronLeftIcon({ size = 18, className }: FigmaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M14.2929 5.29289C14.6834 4.90237 15.3164 4.90237 15.707 5.29289C16.0975 5.68342 16.0975 6.31643 15.707 6.70696L10.414 11.9999L15.707 17.2929C16.0975 17.6834 16.0975 18.3164 15.707 18.707C15.3164 19.0975 14.6834 19.0975 14.2929 18.707L8.29289 12.707C7.90237 12.3164 7.90237 11.6834 8.29289 11.2929L14.2929 5.29289Z" />
    </svg>
  );
}

/** Figma Icons · chevron-up (55:2295). */
function ChevronUpIcon({ size = 18, className }: FigmaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M11.3691 8.22438C11.7618 7.90402 12.3408 7.92662 12.707 8.29273L18.707 14.2927C19.0975 14.6833 19.0975 15.3163 18.707 15.7068C18.3164 16.0973 17.6834 16.0973 17.2929 15.7068L11.9999 10.4138L6.70696 15.7068C6.31643 16.0973 5.68342 16.0973 5.29289 15.7068C4.90237 15.3163 4.90237 14.6833 5.29289 14.2927L11.2929 8.29273L11.3691 8.22438Z" />
    </svg>
  );
}

/** Figma Icons · chevron-down (55:2293). */
function ChevronDownIcon({ size = 18, className }: FigmaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M17.2929 8.29289C17.6834 7.90237 18.3164 7.90237 18.707 8.29289C19.0975 8.68342 19.0975 9.31643 18.707 9.70696L12.707 15.707C12.3164 16.0975 11.6834 16.0975 11.2929 15.707L5.29289 9.70696C4.90237 9.31643 4.90237 8.68342 5.29289 8.29289C5.68342 7.90237 6.31643 7.90237 6.70696 8.29289L11.9999 13.5859L17.2929 8.29289Z" />
    </svg>
  );
}

/** Figma Icons · pin outline (55:2213). */
function PinIcon({ size = 18, className }: FigmaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <g transform="translate(4.0806 1)">
        <path d="M10.9189 6.30859C10.9189 6.21519 10.9181 6.09131 10.9326 5.96484C10.9442 5.86398 10.9635 5.76395 10.9902 5.66602C11.0237 5.54336 11.0708 5.42944 11.1055 5.34277L12.1133 2.82324C12.2674 2.43793 12.3564 2.21086 12.4063 2.04395C12.4088 2.0354 12.41 2.02706 12.4121 2.01953C12.4045 2.01873 12.3963 2.01739 12.3877 2.0166C12.2142 2.00087 11.9706 2 11.5557 2H4.28223C3.86767 2 3.62457 2.00088 3.45117 2.0166C3.44258 2.01738 3.43433 2.01873 3.42676 2.01953C3.42888 2.02706 3.43007 2.0354 3.43262 2.04395C3.48243 2.21086 3.57146 2.43793 3.72559 2.82324L4.7334 5.34277C4.76807 5.42944 4.81516 5.54337 4.84863 5.66602C4.86199 5.71498 4.87322 5.76465 4.88281 5.81445L4.90625 5.96484L4.91797 6.14844C4.91942 6.20695 4.91895 6.26177 4.91895 6.30859V8.43848C4.91895 8.60644 4.92446 8.82981 4.87891 9.05176C4.84267 9.22816 4.78212 9.39921 4.7002 9.55957C4.5972 9.76101 4.45444 9.93147 4.34961 10.0625L2.78027 12.0254C2.43502 12.457 2.21942 12.7268 2.08399 12.9316C2.07529 12.9448 2.0688 12.9582 2.06152 12.9697C2.07515 12.9712 2.0896 12.9751 2.10547 12.9766C2.34998 12.9988 2.69545 13 3.24805 13H12.5908C13.1434 13 13.4889 12.9988 13.7334 12.9766C13.7489 12.9752 13.763 12.9712 13.7764 12.9697C13.7692 12.9584 13.7635 12.9447 13.7549 12.9316C13.6195 12.7268 13.4039 12.457 13.0586 12.0254L11.4893 10.0625C11.3844 9.93148 11.2417 9.76102 11.1387 9.55957C11.0567 9.39921 10.9962 9.22815 10.96 9.05176C10.9144 8.82981 10.9189 8.60644 10.9189 8.43848V6.30859ZM12.9189 8.43848C12.9189 8.54986 12.9193 8.60537 12.9209 8.64551V8.64844L12.9229 8.65137C12.9467 8.68368 12.9813 8.72666 13.0508 8.81348L14.6211 10.7754C14.9415 11.1759 15.2253 11.5303 15.4229 11.8291C15.6102 12.1124 15.8383 12.5136 15.8389 12.998C15.8395 13.607 15.5628 14.1835 15.0869 14.5635C14.7083 14.8657 14.2523 14.938 13.9141 14.9688C13.5575 15.0011 13.1035 15 12.5908 15H8.91895V21C8.91895 21.5523 8.47123 22 7.91895 22C7.36686 21.9998 6.91895 21.5521 6.91895 21V15H3.24805C2.73529 15 2.28144 15.0011 1.92481 14.9688C1.58654 14.938 1.13063 14.8658 0.751954 14.5635C0.275996 14.1835 -0.000594057 13.607 9.58057e-07 12.998C0.000524105 12.5135 0.228695 12.1124 0.416017 11.8291C0.613552 11.5303 0.897364 11.1759 1.21777 10.7754L2.78809 8.81348C2.85755 8.72665 2.8922 8.68368 2.91602 8.65137L2.91797 8.64551C2.91955 8.60537 2.91895 8.54986 2.91895 8.43848V6.19434L2.91797 6.19336V6.19141C2.91027 6.17082 2.89894 6.14236 2.87598 6.08496L1.86817 3.56543C1.7283 3.21577 1.59748 2.89052 1.51563 2.61621C1.43298 2.33922 1.35753 1.9823 1.43848 1.59277C1.54576 1.07698 1.85195 0.624158 2.29102 0.333008C2.62267 0.113157 2.98261 0.0515199 3.27051 0.0253912C3.55553 -0.000454126 3.90579 -9.41173e-08 4.28223 5.95175e-07H11.5557C11.9323 5.95175e-07 12.2832 -0.000474133 12.5684 0.0253912C12.8563 0.0515198 13.2162 0.113157 13.5479 0.333008C13.9869 0.624164 14.2931 1.07701 14.4004 1.59277C14.4813 1.98228 14.4059 2.33923 14.3232 2.61621C14.2414 2.8906 14.1096 3.21566 13.9697 3.56543L12.9619 6.08496C12.939 6.14232 12.9286 6.17083 12.9209 6.19141L12.9199 6.19336C12.9194 6.21533 12.9189 6.24678 12.9189 6.30859V8.43848Z" />
      </g>
    </svg>
  );
}

/** Figma Icons · pin-solid (55:2207). */
function PinSolidIcon({ size = 18, className }: FigmaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <g transform="translate(4.0806 1)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.24301 2.39074e-06C3.88135 -3.06302e-05 3.54532 -6.12661e-05 3.27017 0.0249109C2.98227 0.0510396 2.62301 0.113161 2.29136 0.333012C1.85206 0.624223 1.54547 1.07707 1.43824 1.5931C1.35729 1.98268 1.43303 2.33932 1.5157 2.61632C1.5947 2.88107 1.71953 3.19306 1.85387 3.52884L2.87646 6.0853C2.8902 6.11965 2.91177 6.15761 2.91882 6.19419C2.91932 6.21617 2.91938 6.24632 2.91938 6.30814V8.43876C2.91938 8.50865 2.92036 8.57871 2.91749 8.64856L2.91575 8.65092C2.89191 8.68327 2.85756 8.7265 2.7879 8.81357L1.19036 10.8105C0.881302 11.1968 0.60762 11.5388 0.415808 11.829C0.228485 12.1123 0.000525712 12.5133 1.16378e-06 12.9978C-0.000655101 13.6069 0.276275 14.1831 0.752298 14.5631C1.13098 14.8654 1.58653 14.9379 1.9248 14.9686C2.27116 15.0001 2.70922 15 3.2039 15H6.91937L6.91937 21C6.91937 21.5523 7.36709 22 7.91937 22C8.47166 22 8.91937 21.5523 8.91937 21V15H12.6348C13.1295 15 13.5676 15.0001 13.914 14.9686C14.2522 14.9379 14.7078 14.8654 15.0865 14.5631C15.5625 14.1831 15.8394 13.6069 15.8387 12.9978C15.8382 12.5133 15.6103 12.1123 15.4229 11.829C15.2311 11.5388 14.9575 11.1968 14.6484 10.8105L13.0509 8.81357C13.0072 8.759 12.9627 8.7049 12.9213 8.64856L12.9211 8.64564C12.9196 8.60549 12.9194 8.55027 12.9194 8.43876V6.30814C12.9194 6.24632 12.9194 6.21616 12.9199 6.19419L12.92 6.1927C12.9334 6.15665 12.948 6.12102 12.9623 6.0853L13.9849 3.52883C14.1192 3.19305 14.2441 2.88107 14.3231 2.61632C14.4057 2.33932 14.4815 1.98268 14.4005 1.5931C14.2933 1.07707 13.9867 0.624223 13.5474 0.333012C13.2157 0.113161 12.8565 0.0510396 12.5686 0.0249109C12.2934 -6.12661e-05 11.9574 -3.06302e-05 11.5957 2.39074e-06H4.24301Z"
        />
      </g>
    </svg>
  );
}

/** Figma Icons · dots-horizontal (55:2348). */
function DotsHorizontalIcon({ size = 18, className }: FigmaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12Z" />
    </svg>
  );
}

/** Figma Icons · chevron-selector-vertical (55:2304). */
function ChevronSelectorVerticalIcon({ size = 18, className }: FigmaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M16.2929 14.2927C16.6834 13.9022 17.3164 13.9022 17.707 14.2927C18.0975 14.6833 18.0975 15.3163 17.707 15.7068L12.707 20.7068C12.3164 21.0973 11.6834 21.0973 11.2929 20.7068L6.29289 15.7068C5.90237 15.3163 5.90237 14.6833 6.29289 14.2927C6.68342 13.9022 7.31643 13.9022 7.70696 14.2927L11.9999 18.5857L16.2929 14.2927ZM11.3691 3.22438C11.7618 2.90402 12.3408 2.92662 12.707 3.29273L17.707 8.29273C18.0975 8.68326 18.0975 9.31627 17.707 9.7068C17.3164 10.0973 16.6834 10.0973 16.2929 9.7068L11.9999 5.41383L7.70696 9.7068C7.31643 10.0973 6.68342 10.0973 6.29289 9.7068C5.90237 9.31627 5.90237 8.68326 6.29289 8.29273L11.2929 3.29273L11.3691 3.22438Z" />
    </svg>
  );
}

export const Ic = {
  list: make(List),
  board: make(Columns3),
  inbox: make(Inbox),
  plus: make(Plus),
  close: make(X),
  chevronDown: ChevronDownIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: make(ChevronRight),
  chevronUp: ChevronUpIcon,
  chevronSelectorVertical: ChevronSelectorVerticalIcon,
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
  dots: DotsHorizontalIcon,
  dotsHorizontal: DotsHorizontalIcon,
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
  pin: PinIcon,
  pinSolid: PinSolidIcon,
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
  return name && name in Ic ? Ic[name as IconName] : Ic[fallback];
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
