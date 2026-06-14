import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionValue } from '@/server/auth/session';

/**
 * Gate the authenticated app. Everything under `/app/*` requires a valid
 * session cookie; the landing (`/`), `/login`, `/api/*`, and `/mcp` are public
 * (the API/MCP use their own Bearer auth) and simply aren't matched below.
 *
 * Next 16 `proxy` runs on the Node runtime; our Web Crypto session check works.
 */
export async function proxy(req: NextRequest) {
  const ok = await verifySessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/app/:path*'],
};
