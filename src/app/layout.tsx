import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Inter, Be_Vietnam_Pro, Plus_Jakarta_Sans, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import '@/styles/color-primitives.css';
import '@/styles/color-semantic.css';
import '@/styles/tokens.css';
import '@/styles/app.css';
import '@/styles/screens.css';
import { FONT_STACK, UI_FONT_DEFAULT, UI_FONT_STORAGE_KEY } from '@/lib/fonts';

// Default UI face — Inter (matches the redesign). Preloaded as the app-wide default.
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

// Alternates offered in App Settings → Appearance. We skip preloading — only the
// active face is fetched on routes other than Settings. Be Vietnam Pro is a
// static family, so its weights are pinned (400/500/600/700, plus 800 for the
// wordmark); Plus Jakarta Sans / Hanken expose a variable axis.
const hanken = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-hanken',
  display: 'swap',
  preload: false,
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
  preload: false,
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  // `default` is the bare tagline for pages that set no title of their own
  // (landing, login fallback). `template` wraps any page that sets a `title`
  // (project name, Inbox, …) so the tab reads e.g. "IndieWorker · IndieWork".
  title: {
    default: 'IndieWork — calm project management for solo devs',
    template: '%s · IndieWork',
  },
  description:
    'A single-user, self-hostable project manager for solo indie developers. Module ⟂ Milestone, Inbox capture, and a service layer behind Web, REST, and MCP.',
  metadataBase: new URL('https://indiework.space'),
  // Emits `mobile-web-app-capable`. Deliberately not `title` / `statusBarStyle`:
  // those render the apple-prefixed tags, which iOS has treated as legacy since
  // 11.3 and which make Safari fall back to a manifest-less install that ignores
  // start_url and scope. The manifest's `display: standalone` plus themeColor
  // cover both platforms; the apple-touch-icon is still worth setting.
  appleWebApp: { capable: true },
  icons: { apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom stays available (never `maximumScale: 1`) — it's an accessibility
  // affordance, and the coarse-pointer rules in tokens.css already remove the
  // reasons a user would need to zoom to hit a control.
  maximumScale: 5,
  // Lets the layout paint under the notch / home indicator; every fixed element
  // pays that back with the --safe-* insets (tokens.css).
  viewportFit: 'cover',
  // Single value, not a prefers-color-scheme pair: <html> is hard-coded to
  // data-theme="light", so a dark OS would otherwise tint the system chrome
  // dark around a light app.
  themeColor: '#f9fafc',
};

// Applies the user's saved UI font before first paint, so a reload on any route
// (not just Settings) renders the chosen face with no flash of the default.
// Stored as a raw string under `iw-ui-font` (matches the picker + handoff).
const fontBootScript = `(function(){try{var m=${JSON.stringify(FONT_STACK)},v=localStorage.getItem(${JSON.stringify(
  UI_FONT_STORAGE_KEY,
)})||${JSON.stringify(UI_FONT_DEFAULT)};document.documentElement.style.setProperty('--font-ui',m[v]||m[${JSON.stringify(
  UI_FONT_DEFAULT,
)}]);}catch(e){}})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fontVars = `${inter.variable} ${beVietnamPro.variable} ${plusJakarta.variable} ${hanken.variable} ${plexMono.variable}`;
  // The CSP (src/proxy.ts) is nonce-based with 'strict-dynamic', so this inline
  // script only runs if it carries the per-request nonce — read it from the
  // header the proxy set. (This also makes every route render dynamically.)
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  // fontBootScript sets --font-ui on <html> before hydration, so the element's
  // style attribute legitimately differs from the server markup — suppress the
  // one-level hydration diff for <html> only.
  return (
    <html lang="en" className={fontVars} data-theme="light" suppressHydrationWarning>
      <body>
        {/*
          The browser clears the `nonce` content attribute from the DOM after
          parsing (HTML spec, anti-exfiltration) and Next strips it from the
          client RSC payload, so React sees server `nonce="…"` vs client
          `nonce=""` and flags an attribute mismatch. The script still ran (it
          carried the nonce at parse time); the `__html` is a static constant,
          identical both sides — suppress the cosmetic attribute diff.
        */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: fontBootScript }} />
        {children}
      </body>
    </html>
  );
}
