/**
 * Response headers for serving attachment bytes. Pure (no I/O) so the disposition
 * and the inline security guard can be unit-tested without a route harness.
 */

/** RFC 6266 Content-Disposition with an ASCII-safe fallback + UTF-8 filename. */
export function contentDisposition(filename: string, inline: boolean): string {
  const safe = filename.replace(/["\r\n]/g, '_');
  const kind = inline ? 'inline' : 'attachment';
  return `${kind}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/** Types the browser executes as an active document (can run script). */
const ACTIVE_CONTENT = /^(?:image\/svg\+xml|text\/html|application\/xhtml\+xml|text\/xml|application\/xml)\b/i;

/**
 * Hardening for an attachment served inline on this cookie-bearing origin.
 *
 * `nosniff` is set for everything inline: it stops the browser from upgrading a
 * declared type by sniffing, so a `.txt` full of HTML stays inert text.
 *
 * The sandboxing CSP is added ONLY for script-capable types (SVG/HTML/XML).
 * Those are the real XSS vector — opened by direct navigation they could run
 * script in our origin and ride the session cookie; `sandbox` pins an opaque
 * origin and blocks all script while still painting the markup. Passive types
 * (PDF, images, plain text, media) get no CSP: they can't script our origin, and
 * a strict policy can break native viewers — notably Chrome's built-in PDF
 * viewer, which a blanket `default-src 'none'` / `object-src 'none'` can disable.
 */
export function inlineGuardHeaders(contentType: string): Record<string, string> {
  const headers: Record<string, string> = { 'X-Content-Type-Options': 'nosniff' };
  if (ACTIVE_CONTENT.test(contentType)) {
    headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  }
  return headers;
}
