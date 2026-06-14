'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  passwordMatches,
  createSessionValue,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '@/server/auth/session';

/** Only allow redirecting back into the app, never to an external URL. */
function safeNext(next: string): string {
  return next.startsWith('/app') ? next : '/app';
}

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  const next = safeNext(String(formData.get('next') ?? '/app'));

  if (!(await passwordMatches(password))) {
    return { error: 'Wrong password.' };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  redirect(next);
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/login');
}
