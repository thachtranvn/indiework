import type { ReactNode } from 'react';
import { loadShell } from '@/server/load';
import { AppShell } from '@/components/app/app-shell';
import { FeedbackProvider } from '@/components/ui/toast';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const shell = await loadShell();
  return (
    <FeedbackProvider>
      <AppShell shell={shell}>{children}</AppShell>
    </FeedbackProvider>
  );
}
