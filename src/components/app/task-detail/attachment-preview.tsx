'use client';

/**
 * In-app preview for a single attachment. Tier 1 = what the browser renders
 * natively: images (<img>), PDF (<iframe>), and text/source (escaped <pre>).
 * Anything else falls back to a download prompt. SVG is shown via <img> only
 * (script-inert); the server adds CSP/nosniff on the inline response as a second
 * line of defense for direct navigation.
 */
import { useEffect, useState } from 'react';
import type { AttachmentType } from '@/lib/domain';
import { previewKind, attachmentDownloadUrl } from '@/lib/attachment-preview';
import { Modal } from '@/components/ui/modal';
import { Ic } from '@/components/ui/icons';

export interface PreviewableAttachment {
  id: string;
  name: string;
  ext?: string | null;
  type?: AttachmentType;
}

/** Cap what we paint into the DOM so a 5 MB log doesn't jank the modal. */
const MAX_TEXT_PREVIEW = 200_000;

export function AttachmentPreview({ att, onClose }: { att: PreviewableAttachment; onClose: () => void }) {
  const kind = previewKind(att);
  const src = attachmentDownloadUrl(att.id, { inline: true });

  return (
    <Modal
      className="modal-preview"
      onClose={onClose}
      title={
        <span className="att-preview-title" title={att.name}>
          {att.name}
        </span>
      }
      footer={
        <a className="btn" href={attachmentDownloadUrl(att.id)} download={att.name}>
          <Ic.download size={15} /> Download
        </a>
      }
    >
      <div className="att-preview-body" data-kind={kind}>
        {kind === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element -- same-origin authenticated blob; next/image can't sign it
          <img src={src} alt={att.name} className="att-preview-img" />
        )}
        {kind === 'pdf' && <iframe src={src} title={att.name} className="att-preview-frame" />}
        {kind === 'text' && <TextPreview src={src} />}
        {kind === 'none' && (
          <div className="att-preview-empty">
            <Ic.fileText size={30} />
            <p>No in-app preview for this file type.</p>
            <span>Use Download to open it.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface TextState {
  loading: boolean;
  text: string;
  error: string | null;
  truncated: boolean;
}

function TextPreview({ src }: { src: string }) {
  const [state, setState] = useState<TextState>({ loading: true, text: '', error: null, truncated: false });

  useEffect(() => {
    // A fresh TextPreview mounts per opened attachment, so initial state already
    // reads as loading — no synchronous reset here (it triggers cascading renders).
    const ctrl = new AbortController();
    fetch(src, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not load file (${res.status})`);
        const raw = await res.text();
        const truncated = raw.length > MAX_TEXT_PREVIEW;
        setState({
          loading: false,
          text: truncated ? raw.slice(0, MAX_TEXT_PREVIEW) : raw,
          error: null,
          truncated,
        });
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ loading: false, text: '', error: e instanceof Error ? e.message : 'Could not load file', truncated: false });
      });
    return () => ctrl.abort();
  }, [src]);

  if (state.loading) return <div className="att-preview-status">Loading…</div>;
  if (state.error)
    return (
      <div className="att-preview-status" data-error>
        {state.error}
      </div>
    );
  return (
    <>
      <pre className="att-preview-text">{state.text}</pre>
      {state.truncated && (
        <div className="att-preview-status">Preview truncated — download for the full file.</div>
      )}
    </>
  );
}
