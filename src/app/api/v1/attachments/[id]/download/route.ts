import { attachmentService } from '@/server/services';
import { requireBearer } from '@/server/auth/token';
import { requireApiUser } from '@/server/auth/require-api-user';
import { apiRateState } from '@/server/auth/rate-limit';
import { contentDisposition, inlineGuardHeaders } from '@/server/attachment-headers';
import { ok, unauthorized, tooManyRequests, handleServiceError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const rate = apiRateState(req);
  if (rate.limited) return tooManyRequests(rate.retryAfterSec);
  const userId = await requireApiUser(req);
  if (!userId) return unauthorized();
  try {
    const { id } = await ctx.params;
    const { row, body, contentType } = await attachmentService.open(id);
    // Images render inline for thumbnails; `?inline=1` opts any type into the
    // in-app preview. Either way we must harden the response (see guard headers).
    const inline = row.type === 'image' || new URL(req.url).searchParams.has('inline');
    return new Response(Buffer.from(body), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition(row.name, inline),
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'private, max-age=3600',
        ...(inline ? inlineGuardHeaders(contentType) : {}),
      },
    });
  } catch (e) {
    return handleServiceError(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const rate = apiRateState(req);
  if (rate.limited) return tooManyRequests(rate.retryAfterSec);
  const userId = await requireBearer(req);
  if (!userId) return unauthorized();
  try {
    const { id } = await ctx.params;
    await attachmentService.remove(id);
    return ok({ ok: true });
  } catch (e) {
    return handleServiceError(e);
  }
}
