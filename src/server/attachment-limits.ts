/** Max attachment size (5 MiB). Enforced on every upload boundary. */
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

/** Strip path segments from a client-provided filename; keep display name only. */
export function sanitizeAttachmentName(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() ?? '';
  const safe = base.slice(0, 255);
  return safe || 'file';
}

export function humanAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function extFromName(name: string): string {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : '';
}

/** User-facing label for the upload size cap (shared by UI + server errors). */
export function attachmentSizeLimitLabel(): string {
  return humanAttachmentSize(MAX_ATTACHMENT_BYTES);
}

/** Map thrown upload errors (server action / Next body limit) to a short UI message. */
export function attachmentUploadErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (/body exceeded/i.test(err.message)) {
      return `File too large (max ${attachmentSizeLimitLabel()})`;
    }
    return err.message;
  }
  return 'Upload failed';
}
