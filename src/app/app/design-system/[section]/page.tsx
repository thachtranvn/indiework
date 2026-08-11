import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesignSystemScreen } from '@/components/app/design-system';
import {
  DS_ITEM_IDS,
  DS_ITEM_META,
  isDsItemId,
} from '@/components/app/design-system-nav';

export const dynamic = 'force-dynamic';

type Params = { section: string };

export function generateStaticParams() {
  return DS_ITEM_IDS.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { section } = await params;
  if (!isDsItemId(section)) return { title: 'Design System' };
  return { title: `${DS_ITEM_META[section].title} · Design System` };
}

export default async function DesignSystemSectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { section } = await params;
  if (!isDsItemId(section)) notFound();
  return <DesignSystemScreen section={section} />;
}
