import { describe, test, expect } from 'vitest';
import { previewKind, attachmentDownloadUrl } from '@/lib/attachment-preview';
import { contentDisposition, inlineGuardHeaders } from '@/server/attachment-headers';

describe('previewKind', () => {
  test('treats image type or image extension as image', () => {
    expect(previewKind({ type: 'image', ext: null, name: 'screenshot' })).toBe('image');
    expect(previewKind({ type: 'file', ext: 'png', name: 'a.png' })).toBe('image');
    expect(previewKind({ type: 'file', ext: 'svg', name: 'icon.svg' })).toBe('image');
  });

  test('detects pdf', () => {
    expect(previewKind({ type: 'file', ext: 'pdf', name: 'doc.pdf' })).toBe('pdf');
  });

  test('detects text and source files', () => {
    for (const ext of ['md', 'json', 'csv', 'txt', 'ts', 'html', 'yaml']) {
      expect(previewKind({ type: 'file', ext, name: `f.${ext}` })).toBe('text');
    }
  });

  test('falls back to none for opaque binaries', () => {
    for (const ext of ['docx', 'xlsx', 'zip', 'mp4', 'exe']) {
      expect(previewKind({ type: 'file', ext, name: `f.${ext}` })).toBe('none');
    }
  });

  test('derives the extension from the name when ext is absent', () => {
    expect(previewKind({ type: 'file', ext: null, name: 'notes.MD' })).toBe('text');
    expect(previewKind({ type: 'file', name: 'photo.JPEG' })).toBe('image');
  });

  test('is case-insensitive on the extension', () => {
    expect(previewKind({ type: 'file', ext: 'PDF', name: 'X.PDF' })).toBe('pdf');
  });
});

describe('attachmentDownloadUrl', () => {
  test('builds plain and inline URLs', () => {
    expect(attachmentDownloadUrl('abc')).toBe('/api/v1/attachments/abc/download');
    expect(attachmentDownloadUrl('abc', { inline: true })).toBe('/api/v1/attachments/abc/download?inline=1');
  });
});

describe('contentDisposition', () => {
  test('switches between inline and attachment', () => {
    expect(contentDisposition('a.pdf', false)).toBe(`attachment; filename="a.pdf"; filename*=UTF-8''a.pdf`);
    expect(contentDisposition('a.pdf', true)).toBe(`inline; filename="a.pdf"; filename*=UTF-8''a.pdf`);
  });

  test('sanitizes quotes and newlines in the ascii filename', () => {
    const d = contentDisposition('a"b\r\n.txt', false);
    expect(d).toContain('filename="a_b__.txt"');
  });

  test('percent-encodes unicode in the extended filename', () => {
    const d = contentDisposition('báo cáo.pdf', true);
    expect(d).toContain("filename*=UTF-8''b%C3%A1o%20c%C3%A1o.pdf");
  });
});

describe('inlineGuardHeaders', () => {
  test('always blocks MIME sniffing', () => {
    for (const ct of ['application/pdf', 'image/png', 'text/plain', 'image/svg+xml']) {
      expect(inlineGuardHeaders(ct)['X-Content-Type-Options']).toBe('nosniff');
    }
  });

  test('sandboxes script-capable types (SVG/HTML/XML)', () => {
    for (const ct of ['image/svg+xml', 'text/html', 'application/xhtml+xml', 'text/xml', 'application/xml']) {
      const csp = inlineGuardHeaders(ct)['Content-Security-Policy'];
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain('sandbox');
      // sandbox (no allow-scripts) + no script-src unsafe-inline ⇒ scripts blocked.
      expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    }
  });

  test('does NOT set a CSP for passive types so native viewers (PDF) keep working', () => {
    for (const ct of ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'video/mp4']) {
      expect(inlineGuardHeaders(ct)['Content-Security-Policy']).toBeUndefined();
    }
  });

  test('matches on the content-type prefix, ignoring charset', () => {
    expect(inlineGuardHeaders('text/html; charset=utf-8')['Content-Security-Policy']).toContain('sandbox');
    expect(inlineGuardHeaders('text/plain; charset=utf-8')['Content-Security-Policy']).toBeUndefined();
  });
});
