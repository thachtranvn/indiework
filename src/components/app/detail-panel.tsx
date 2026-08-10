'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useTaskNav, taskFullPath, taskCanonicalUrl } from '@/lib/task-nav';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { CopyLinkButton } from '@/components/ui/interactive';
import { Ic } from '@/components/ui/icons';
import { useTaskDetail } from './task-detail/use-task-detail';
import { TitleEditor, StatusNote, Attachments } from './task-detail/parts';
import { ParentLink, TaskProperties, TaskSubtasks, TaskActivity, ConvertToTaskControl, DeleteControl } from './task-detail/sections';
import { DetailPanelSkeleton } from './skeletons';

/**
 * Slide-in inspector (1-column overlay). Shares its fetch/mutations (the hook)
 * and inner sections with the standalone full page; the panel adds only its
 * own chrome: a ref header with an "open full page" link, escape-to-close, and
 * a footer delete. Related-task clicks open a peek overlay (`openTask`).
 * One persistent `<section>` so CSS mount keyframes don't replay when
 * skeleton → content.
 */
export function DetailPanel({
  taskRef,
  taskId,
  onClose,
}: {
  taskRef: string | null;
  taskId: string | null;
  onClose: () => void;
}) {
  const { openTask } = useTaskNav();
  const { detail, missing, loadError, patch, saveStatusNote, addComment, editComment, addChild, toggleChild, convertToTask, remove, reload } = useTaskDetail({
    taskRef,
    taskId,
  });
  const bodyRef = useRef<HTMLDivElement>(null);
  const ticketElRef = useRef<HTMLDivElement>(null);
  const [headMetaVisible, setHeadMetaVisible] = useState(false);
  const settled = Boolean(detail || missing || loadError);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Reveal ID + title in the sticky header only after the in-body ticket
  // identity scrolls out of view.
  useEffect(() => {
    const body = bodyRef.current;
    const ticket = ticketElRef.current;
    setHeadMetaVisible(false);
    if (!body || !ticket) return;
    body.scrollTop = 0;
    const io = new IntersectionObserver(([entry]) => setHeadMetaVisible(!entry.isIntersecting), {
      root: body,
      threshold: 0,
    });
    io.observe(ticket);
    return () => io.disconnect();
  }, [detail?.task.id]);

  const closeBtn = (
    <button className="icon-btn" onClick={onClose} aria-label="Close panel">
      <Ic.chevronRight size={16} />
    </button>
  );

  let body: ReactNode;
  if (!settled) {
    body = (
      <>
        <div className="dp-head">
          {closeBtn}
          <span className="dp-head-divider" aria-hidden />
          <span className="dp-head-meta" />
        </div>
        <DetailPanelSkeleton />
      </>
    );
  } else if (!detail || missing || loadError) {
    body = (
      <>
        <div className="dp-head">
          {closeBtn}
          <span className="dp-head-divider" aria-hidden />
          <span className="dp-head-meta" data-visible="">
            <span className="dp-head-ref">{taskRef ?? 'Task'}</span>
          </span>
        </div>
        <div className="dp-body">
          {missing ? (
            <p className="dp-section-label">This task no longer exists.</p>
          ) : (
            // A thrown fetch (most often a Server Action version-skew 404 from a
            // tab left open across a deploy) — the task likely still exists, so
            // offer a refresh instead of falsely claiming it was deleted.
            <div className="dp-loaderr">
              <p className="dp-section-label">Couldn’t load this task.</p>
              <p className="dp-loaderr-hint">The app may have updated. Refresh to continue.</p>
              <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          )}
        </div>
      </>
    );
  } else {
    const { task, displayRef, parent, comments, attachments } = detail;
    const pending = task.status === 'pending';
    const fullPath = displayRef ? taskFullPath(displayRef, task.title) : null;
    body = (
      <>
        <div className="dp-head">
          {closeBtn}
          <span className="dp-head-divider" aria-hidden />
          <div className="dp-head-meta" data-visible={headMetaVisible ? '' : undefined} aria-hidden={!headMetaVisible}>
            {displayRef ? <span className="dp-head-ref">{displayRef}</span> : <span className="dp-head-ref">Inbox</span>}
            <span className="dp-head-meta-divider" aria-hidden />
            <span className="dp-head-title">{task.title}</span>
          </div>
          <div className="dp-head-actions">
            {fullPath && displayRef && (
              <CopyLinkButton getUrl={() => taskCanonicalUrl(window.location.origin, displayRef, task.title)} />
            )}
            {fullPath && (
              <Link className="icon-btn" href={fullPath} title="Open as full page" aria-label="Open as full page">
                <Ic.maximize size={16} />
              </Link>
            )}
          </div>
        </div>

        <div className="dp-body" ref={bodyRef}>
          <ParentLink parent={parent} onOpenTask={openTask} />

          <div className="dp-ticket" ref={ticketElRef}>
            {displayRef ? <p className="dp-ticket-ref">{displayRef}</p> : <p className="dp-ticket-ref">Inbox</p>}
            <div className="dp-check-title">
              <TitleEditor key={task.id} value={task.title} onSave={(title) => patch({ title })} />
            </div>
          </div>

          <StatusNote key={`note-${task.id}`} value={task.statusNote ?? ''} pending={pending} onSave={saveStatusNote} />

          <TaskProperties detail={detail} patch={patch} />

          <p className="dp-section-label">Description</p>
          <MarkdownEditor
            key={`desc-${task.id}`}
            value={task.description ?? ''}
            onSave={(d) => patch({ description: d })}
            placeholder="Add a description…"
          />

          <TaskSubtasks detail={detail} onOpenTask={openTask} toggleChild={toggleChild} addChild={addChild} />

          <Attachments taskId={task.id} items={attachments} onChanged={reload} />

          <TaskActivity comments={comments} addComment={addComment} editComment={editComment} />
        </div>

        <div className="dp-foot">
          {/* Keyed per task: the panel never remounts on task switch, so without
              this the inline confirm would persist across switches and a stray
              confirm could fire against the newly-opened task. */}
          {task.parentId && (
            <ConvertToTaskControl
              key={`conv-${task.id}`}
              onConvert={async () => {
                await convertToTask();
              }}
            />
          )}
          <DeleteControl
            key={task.id}
            onDelete={async () => {
              if (await remove()) onClose();
            }}
          />
        </div>
      </>
    );
  }

  return (
    <section className="detail-panel" aria-busy={!settled ? true : undefined}>
      {body}
    </section>
  );
}
