/**
 * How an attachment can be shown in-app. Pure + dependency-free so it runs on
 * both the client (the preview modal) and the server (deciding inline serving).
 *
 * Driven by file extension — the DB stores no MIME type, only `type`
 * ('file' | 'image') and `ext`. `type === 'image'` is trusted for images that
 * arrived as `image/*` without a useful extension.
 */
import type { AttachmentType } from '@/lib/domain';
import { extFromName } from '@/server/attachment-limits';

export type PreviewKind = 'image' | 'pdf' | 'text' | 'none';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico']);

/**
 * Extensions safe to fetch and render as escaped text. HTML/SVG live here too:
 * `<pre>{text}</pre>` shows source (React-escaped), it never executes — so this
 * is the *source view*, distinct from the rendered (and unsafe) inline serving.
 */
const TEXT_EXT = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'log', 'yml', 'yaml', 'xml',
  'html', 'htm', 'css', 'scss', 'less', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx',
  'sh', 'bash', 'zsh', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'php', 'c', 'h',
  'cpp', 'sql', 'toml', 'ini', 'conf', 'env', 'gitignore', 'dockerfile',
]);

export function previewKind(att: {
  ext?: string | null;
  name?: string | null;
  type?: AttachmentType;
}): PreviewKind {
  const ext = (att.ext ?? extFromName(att.name ?? '')).toLowerCase();
  if (att.type === 'image' || IMAGE_EXT.has(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (TEXT_EXT.has(ext)) return 'text';
  return 'none';
}

/** Same-origin, auth-gated download endpoint. `inline` requests in-browser render. */
export function attachmentDownloadUrl(id: string, opts?: { inline?: boolean }): string {
  return `/api/v1/attachments/${id}/download${opts?.inline ? '?inline=1' : ''}`;
}
