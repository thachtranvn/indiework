import { redirect } from 'next/navigation';
import { DEFAULT_DS_ITEM } from '@/components/app/design-system-nav';

export const dynamic = 'force-dynamic';

/** `/app/design-system` → first section so every gallery page has a stable URL. */
export default function DesignSystemIndexPage() {
  redirect(`/app/design-system/${DEFAULT_DS_ITEM}`);
}
