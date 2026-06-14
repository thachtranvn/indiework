import type { ReactNode } from 'react';
import { loadShell } from '@/server/load';
import { AppShell } from '@/components/app/app-shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const shell = await loadShell();
  return <AppShell shell={shell}>{children}</AppShell>;
}
