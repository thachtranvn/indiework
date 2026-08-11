import type { Metadata } from 'next';
import { DesignSystemScreen } from '@/components/app/design-system';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Design System' };

export default function DesignSystemPage() {
  return <DesignSystemScreen />;
}
