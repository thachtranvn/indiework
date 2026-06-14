import type { Metadata } from 'next';
import { Figtree, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import '@/styles/tokens.css';
import '@/styles/app.css';
import '@/styles/screens.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'IndieWork — calm project management for solo devs',
  description:
    'A single-user, self-hostable project manager for solo indie developers. Module ⟂ Milestone, Inbox capture, and a service layer behind Web, REST, and MCP.',
  metadataBase: new URL('https://indiework.space'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${plexMono.variable}`} data-theme="light">
      <body>{children}</body>
    </html>
  );
}
