'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Ic } from '@/components/ui/icons';
import { updateProject } from '@/app/_actions/projects';

export function ProjectHeader({
  project,
  active,
  right,
}: {
  project: { id: string; key: string; name: string; emoji: string | null };
  active: 'overview' | 'issues' | 'board';
  right?: ReactNode;
}) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const base = `/app/p/${project.key}`;

  const save = async (patch: { name?: string; emoji?: string }) => {
    await updateProject(project.id, patch);
    router.refresh();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <EmojiPicker
            value={project.emoji ?? '🚀'}
            onPick={(e) => save({ emoji: e })}
            triggerClass="topbar-emoji-btn"
          />
          <input
            className="topbar-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== project.name && save({ name: name.trim() })}
            spellCheck={false}
            aria-label="Project name"
          />
          <span className="topbar-key">{project.key}</span>
        </div>
      </div>
      <div className="tabs">
        <Link className="tab" data-active={active === 'overview' ? '' : undefined} href={`${base}/overview`}>
          <Ic.layers size={15} /> Overview
        </Link>
        <Link className="tab" data-active={active === 'issues' ? '' : undefined} href={base}>
          <Ic.list size={15} /> Issues
        </Link>
        <Link className="tab" data-active={active === 'board' ? '' : undefined} href={`${base}/board`}>
          <Ic.board size={15} /> Board
        </Link>
        {right && <div className="tabs-right">{right}</div>}
      </div>
    </>
  );
}
