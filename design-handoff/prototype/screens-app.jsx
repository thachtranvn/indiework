/* ============================================================
   App-level surfaces — Global Search, App Settings (API Keys),
   Workspace create / rename
   ============================================================ */
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo: useMemoA } = React;
const APP_UI = window.UI;
const { PROJECT_STATUS_MAP: APP_PSMAP } = window.PMData;

/* ---------------- Global Search (command palette) ---------------- */
function GlobalSearch({ projects, tasks, onClose, onNavigate }) {
  const [q, setQ] = useStateA("");
  const [active, setActive] = useStateA(0);
  const inputRef = useRefA(null);
  useEffectA(() => { inputRef.current?.focus(); }, []);

  const results = useMemoA(() => {
    const term = q.trim().toLowerCase();
    const projMatches = projects
      .filter(p => !term || p.name.toLowerCase().includes(term) || p.key.toLowerCase().includes(term)
        || (p.shortDesc || "").toLowerCase().includes(term) || (p.tags || []).some(t => t.toLowerCase().includes(term)))
      .slice(0, term ? 6 : 5)
      .map(p => ({ kind: "project", id: p.id, project: p }));
    const taskMatches = !term ? [] : tasks
      .filter(t => t.title.toLowerCase().includes(term) || (t.ref || "").toLowerCase().includes(term))
      .slice(0, 8)
      .map(t => ({ kind: "task", id: t.id, task: t }));
    return [...projMatches, ...taskMatches];
  }, [q, projects, tasks]);

  useEffectA(() => { setActive(0); }, [q]);

  const go = (r) => { if (r) { onNavigate(r); onClose(); } };

  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(results[active]); }
  };

  const projName = (id) => projects.find(p => p.id === id);

  return (
    <div className="search-scrim" onMouseDown={onClose}>
      <div className="search-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="search-head">
          <Ic.search size={18} />
          <input ref={inputRef} value={q} placeholder="Search projects and tasks…"
            onChange={e => setQ(e.target.value)} onKeyDown={onKey} />
          <kbd className="search-esc">Esc</kbd>
        </div>
        <div className="search-body">
          {results.length === 0 && (
            <div className="search-empty">No matches for “{q}”.</div>
          )}
          {results.length > 0 && (() => {
            let lastKind = null;
            return results.map((r, i) => {
              const head = r.kind !== lastKind ? <div key={"h" + r.kind} className="search-group">{r.kind === "project" ? "Projects" : "Tasks"}</div> : null;
              lastKind = r.kind;
              const row = r.kind === "project" ? (
                <button key={r.kind + r.id} className="search-row" data-active={i === active ? "" : undefined}
                  onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
                  <span className="search-emoji">{r.project.emoji}</span>
                  <span className="search-text">
                    <span className="search-title">{r.project.name}</span>
                    <span className="search-sub">{r.project.shortDesc}</span>
                  </span>
                  <span className="search-tag">{r.project.key}</span>
                </button>
              ) : (
                <button key={r.kind + r.id} className="search-row" data-active={i === active ? "" : undefined}
                  onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
                  <span className="search-icon"><APP_UI.CircleCheck done={r.task.done} status={r.task.status} size={16} /></span>
                  <span className="search-text">
                    <span className="search-title">{r.task.title}</span>
                    <span className="search-sub">{r.task.projectId ? projName(r.task.projectId)?.name : "Inbox"}</span>
                  </span>
                  <span className="search-ref">{r.task.ref}</span>
                </button>
              );
              return <React.Fragment key={"f" + r.kind + r.id}>{head}{row}</React.Fragment>;
            });
          })()}
        </div>
        <div className="search-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Workspace create modal ---------------- */
function WorkspaceForm({ onClose, onCreate }) {
  const [name, setName] = useStateA("");
  const [tagline, setTagline] = useStateA("");
  const submit = () => { if (name.trim()) { onCreate({ name: name.trim(), tagline: tagline.trim() || "new workspace" }); onClose(); } };
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" style={{ width: "min(440px,100%)" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>New workspace</h2>
          <button className="icon-btn" onClick={onClose}><Ic.close size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Name</label>
            <input value={name} autoFocus placeholder="e.g. Open Source"
              onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }} />
          </div>
          <div className="field">
            <label>Tagline <span style={{ fontWeight: 450, color: "var(--text-faint)" }}>— optional</span></label>
            <input value={tagline} placeholder="What lives here?" onChange={e => setTagline(e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Create workspace</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- App Settings (General + API Keys) ---------------- */
const SCOPE_OPTS = ["read", "write", "read-write"];
function genTail() {
  const c = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

function ApiKeyRow({ k, justCreated, onRevoke }) {
  const [copied, setCopied] = useStateA(false);
  const full = `${k.prefix}${justCreated ? k.full : "••••••••••••"}${justCreated ? "" : k.tail}`;
  const copy = () => {
    navigator.clipboard?.writeText(justCreated ? `${k.prefix}${k.full}` : `${k.prefix}…${k.tail}`).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1100);
  };
  return (
    <div className="ak-row" data-new={justCreated ? "" : undefined}>
      <span className="ak-icon"><Ic.keyRound size={17} /></span>
      <div className="ak-main">
        <div className="ak-line">
          <span className="ak-name">{k.name}</span>
          <span className="ak-scope" data-scope={k.scope}>{k.scope}</span>
          {justCreated && <span className="ak-new-badge">New · copy it now</span>}
        </div>
        <code className="ak-secret">{full}</code>
        <div className="ak-meta">Created {APP_UI.fmtDate(k.created, { month: "short", day: "numeric", year: "numeric" })} · Last used {APP_UI.fmtDate(k.lastUsed, { month: "short", day: "numeric" }) || "never"}</div>
      </div>
      <div className="ak-actions">
        <button className="icon-btn" title={copied ? "Copied" : "Copy"} onClick={copy}>
          {copied ? <Ic.check size={16} sw={2.4} /> : <Ic.copy size={16} />}
        </button>
        <button className="icon-btn" data-danger="" title="Revoke" onClick={() => onRevoke(k.id)}><Ic.trash size={16} /></button>
      </div>
    </div>
  );
}

function CreateKeyForm({ onCreate, onCancel }) {
  const [name, setName] = useStateA("");
  const [scope, setScope] = useStateA("read-write");
  return (
    <div className="ak-create">
      <div className="ak-create-grid">
        <input className="ak-create-name" autoFocus value={name} placeholder="Key name (e.g. CI deploy)"
          onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && name.trim()) onCreate(name.trim(), scope); }} />
        <div className="ak-scope-pick">
          {SCOPE_OPTS.map(s => (
            <button key={s} className="ak-scope-btn" data-on={s === scope ? "" : undefined} onClick={() => setScope(s)}>{s}</button>
          ))}
        </div>
      </div>
      <div className="ak-create-foot">
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={() => name.trim() && onCreate(name.trim(), scope)}>Generate key</button>
      </div>
    </div>
  );
}

function SettingsView({ section, setSection, workspace, onRenameWs, onSetWsEmoji, apiKeys, keyOps }) {
  const [creating, setCreating] = useStateA(false);
  const nav = [
    { id: "general", label: "General", icon: <Ic.settings size={16} /> },
    { id: "api",     label: "API keys", icon: <Ic.keyRound size={16} /> },
  ];
  return (
    <div className="settings">
      <aside className="settings-nav">
        <div className="settings-navlabel">App settings</div>
        {nav.map(n => (
          <button key={n.id} className="settings-navitem" data-active={section === n.id ? "" : undefined}
            onClick={() => setSection(n.id)}>{n.icon}<span>{n.label}</span></button>
        ))}
      </aside>

      <div className="settings-main">
        {section === "general" && (
          <div className="settings-pane">
            <h2 className="settings-h">General</h2>
            <p className="settings-sub">Manage the current workspace.</p>
            <div className="set-card">
              <div className="set-field">
                <label>Workspace name</label>
                <input className="set-input" value={workspace.name} onChange={e => onRenameWs(e.target.value)} />
              </div>
              <div className="set-field">
                <label>Tagline</label>
                <input className="set-input" value={workspace.tagline} onChange={e => onRenameWs(workspace.name, e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {section === "api" && (
          <div className="settings-pane">
            <div className="settings-head-row">
              <div>
                <h2 className="settings-h">API keys</h2>
                <p className="settings-sub">Keys let scripts, the CLI, and webhooks talk to IndieWork. Treat them like passwords.</p>
              </div>
              {!creating && <button className="btn btn-primary" onClick={() => setCreating(true)}><Ic.plus size={15} sw={2.2} /> Create key</button>}
            </div>
            {creating && <CreateKeyForm onCancel={() => setCreating(false)}
              onCreate={(name, scope) => { keyOps.add(name, scope); setCreating(false); }} />}
            <div className="ak-list">
              {apiKeys.length === 0 && <div className="ak-empty"><Ic.keyRound size={26} /><p>No API keys yet. Create one to connect the CLI or a webhook.</p></div>}
              {apiKeys.map(k => <ApiKeyRow key={k.id} k={k} justCreated={!!k.full} onRevoke={keyOps.revoke} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.AppScreens = { GlobalSearch, WorkspaceForm, SettingsView, genTail };
