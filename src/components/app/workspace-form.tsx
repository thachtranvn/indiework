'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { createWorkspace } from '@/app/_actions/workspace';

export function WorkspaceForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createWorkspace({ name: name.trim(), tagline: tagline.trim() || null });
      // New workspace is now active and empty — land on the app home, not a
      // project page that belongs to the previous workspace.
      router.push('/app');
      router.refresh();
      onClose();
    } catch (e) {
      // Don't fail silently — keep the modal open with the typed values and say why.
      setError(e instanceof Error ? e.message : 'Could not create workspace');
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New workspace"
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={busy || !name.trim()}>
            Create
          </Button>
        </>
      }
    >
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Side projects" autoFocus />
      </div>
      <div className="field">
        <label>Tagline</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="what this workspace is for"
        />
      </div>
      {error && <p className="login-err">{error}</p>}
    </Modal>
  );
}
