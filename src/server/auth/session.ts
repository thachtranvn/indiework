/**
 * Session = a signed cookie proving "this person knows APP_PASSWORD".
 * Uses Web Crypto (HMAC-SHA256) so it runs in both the Edge middleware and
 * Node server actions. No user table — the single source of truth is .ENV.
 */
import { env } from '@/server/env';

export const SESSION_COOKIE = 'iw_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (seconds)

const encoder = new TextEncoder();

function b64url(buf: ArrayBuffer): string {
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.COOKIE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return b64url(sig);
}

/** Build a fresh signed session value: "<issuedAtMs>.<hmac>". */
export async function createSessionValue(): Promise<string> {
  const issued = Date.now().toString();
  return `${issued}.${await hmac(issued)}`;
}

/** Validate a session cookie value: signature matches and not expired. */
export async function verifySessionValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return false;
  const issued = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (sig !== (await hmac(issued))) return false;
  const ts = Number(issued);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts <= SESSION_MAX_AGE * 1000;
}

/** Constant-time-ish password check (compares HMACs, not raw strings). */
export async function passwordMatches(password: string): Promise<boolean> {
  return (await hmac(password)) === (await hmac(env.APP_PASSWORD));
}
