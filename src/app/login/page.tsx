import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionValue } from '@/server/auth/session';
import { safeNext } from '@/server/auth/safe-next';
import { env } from '@/server/env';
import { LoginForm } from './login-form';

// Bare word; the root layout's title template renders it as "Unlock · IndieWork".
export const metadata: Metadata = { title: 'Unlock' };

// Render at request time so the demo flag is read from the container's env
// (DEMO_MODE), not baked in at build — one image serves both app and demo.
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);

  // Already signed in? Skip the form and bounce to the app shell. Mirror the
  // proxy's gate exactly (signature + expiry, no DB lookup) so the two checks
  // never disagree and produce a /login ⇄ /app redirect loop.
  const authed = await verifySessionValue((await cookies()).get(SESSION_COOKIE)?.value);
  if (authed) redirect(target);

  // Read at runtime (not NEXT_PUBLIC_*): the same image runs both the real app
  // and the demo, so the demo flag must come from the container's env, not the
  // build. Only the demo container sets DEMO_MODE=true.
  const isDemo = process.env.DEMO_MODE === 'true';
  const demoHint = isDemo ? (process.env.DEMO_HINT || 'demo') : undefined;
  const demoEmail = isDemo ? (process.env.DEMO_EMAIL || 'demo@demo.local') : undefined;

  // Local/dev convenience: prefill the seeded admin credentials so you can
  // unlock in one click. Never do this in production (or the public demo,
  // which has its own throwaway hint above).
  const prefillEmail = isDemo
    ? demoEmail
    : env.NODE_ENV === 'development'
      ? env.ADMIN_EMAIL
      : undefined;
  const prefillPassword = isDemo
    ? demoHint
    : env.NODE_ENV === 'development'
      ? env.ADMIN_PASSWORD
      : undefined;

  return (
    <LoginForm
      next={target}
      demoHint={demoHint}
      demoEmail={demoEmail}
      prefillEmail={prefillEmail}
      prefillPassword={prefillPassword}
    />
  );
}
