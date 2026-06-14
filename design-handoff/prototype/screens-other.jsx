/* ============================================================
   Board, Inbox, Milestones, Modules, Project form, Login
   ============================================================ */
const { useState, useEffect, useRef } = React;
const { BOARD_COLUMNS, STATUS_MAP: O_ST, PROJECTS: O_PROJ, MODULES: O_MOD, MILESTONES: O_MILE, MODULE_MAP: O_MODM } = window.PMData;
const { Popover } = window.UI;

/* ---------------- Board ---------------- */
function Board({ tasks, projectId, onSelect, onUpdate, onAdd }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const proj = O_PROJ.find(p => p.id === projectId);
  const list = tasks.filter(t => t.projectId === projectId && t.status !== "inbox");

  return (
    <div className="board">
      {BOARD_COLUMNS.map(colId => {
        const s = O_ST[colId];
        const cards = list.filter(t => t.status === colId);
        return (
          <div key={colId} className="board-col" data-over={overCol === colId ? "" : undefined}
            onDragOver={e => { e.preventDefault(); setOverCol(colId); }}
            onDragLeave={() => setOverCol(c => c === colId ? null : c)}
            onDrop={() => { if (dragId) onUpdate(dragId, { status: colId, done: colId === "done" }); setDragId(null); setOverCol(null); }}>
            <div className="board-col-head">
              <span className="dot" style={{ background: `var(--st-${s.key})` }} />
              <span className="board-col-name">{s.label}</span>
              <span className="board-col-count">{cards.length}</span>
            </div>
            <div className="board-list">
              {cards.map(t => (
                <div key={t.id} className="board-card" draggable data-dragging={dragId === t.id ? "" : undefined}
                  onDragStart={() => setDragId(t.id)} onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  onClick={() => onSelect(t.id)}>
                  <div className="board-card-title" style={t.status === "done" ? { textDecoration: "line-through", color: "var(--text-faint)" } : null}>{t.title}</div>
                  <div className="board-card-meta">
                    {t.priority !== "none" && <UI.PriorityBars priority={t.priority} />}
                    {t.moduleId && <UI.ModuleTag moduleId={t.moduleId} faint />}
                    <UI.RefTag value={t.ref} />
                  </div>
                </div>
              ))}
            </div>
            <button className="board-add" onClick={() => onAdd("New task", colId)}><Ic.plus size={14} /> Add</button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Inbox ---------------- */
function InboxView({ tasks, onSelect, onToggle, onAssign }) {
  const items = tasks.filter(t => t.projectId === null);
  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty-emoji">📥</div>
        <h3>Inbox zero</h3>
        <p>Nothing to triage. Type an idea in the box above to capture it — sort it into a project later.</p>
      </div>
    );
  }
  return (
    <div className="scroll-body">
      {items.map(t => (
        <div key={t.id} className="task-row" onClick={() => onSelect(t.id)}>
          <UI.CircleCheck done={t.done} status={t.status} onToggle={() => onToggle(t.id)} />
          <div className="task-main"><span className="task-title">{t.title}</span></div>
          <div className="task-meta">
            <span className="task-reveal">
              <Popover width={190} align="right" trigger={
                <button className="tool-btn" onClick={e => e.stopPropagation()}><Ic.arrowRight size={13} /> Move to…</button>
              }>
                {(close) => (
                  <div className="opt-list">
                    <div className="pop-label">Assign to project</div>
                    {O_PROJ.map(p => (
                      <button key={p.id} className="opt" onClick={() => { onAssign(t.id, p.id); close(); }}>
                        <span className="nav-emoji" style={{ fontSize: 14, width: 18 }}>{p.emoji}</span> {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </Popover>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Milestones management ---------------- */
function Milestones({ tasks, projectId }) {
  const miles = O_MILE.filter(m => m.projectId === projectId);
  const proj = O_PROJ.find(p => p.id === projectId);
  return (
    <div className="mgmt">
      <div className="mgmt-head">
        <div>
          <h2>Milestones</h2>
          <p>Phases of {proj.name} — each with a target date and progress. Drag to reorder.</p>
        </div>
      </div>
      {miles.map(m => {
        const mt = tasks.filter(t => t.milestoneId === m.id);
        const done = mt.filter(t => t.done || t.status === "cancelled").length;
        const pct = mt.length ? done / mt.length : 0;
        return (
          <div className="mile-card" key={m.id}>
            <span className="mile-grip"><Ic.grip size={16} /></span>
            <div className="mile-body">
              <div className="mile-name">{m.name}</div>
              <div className="mile-sub">
                <span><Ic.calendar size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />{UI.fmtDate(m.date, { month: "short", day: "numeric", year: "numeric" })}</span>
                <span>{done}/{mt.length} tasks</span>
              </div>
            </div>
            <div className="mile-prog">
              <UI.Progress value={pct} width={92} tone={pct === 1 ? "done" : "accent"} />
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 560, width: 32 }}>{Math.round(pct * 100)}%</span>
            </div>
            <span className="mile-state" data-state={m.state}>{m.state}</span>
          </div>
        );
      })}
      <button className="add-row-btn"><Ic.plus size={15} /> New milestone</button>
    </div>
  );
}

/* ---------------- Modules management ---------------- */
function Modules({ tasks, projectId }) {
  const mods = O_MOD.filter(m => m.projectId === projectId);
  const proj = O_PROJ.find(p => p.id === projectId);
  return (
    <div className="mgmt">
      <div className="mgmt-head">
        <div>
          <h2>Modules</h2>
          <p>Sub-systems of {proj.name}. Simpler than milestones — just a name & colour. Drag to reorder.</p>
        </div>
      </div>
      {mods.map(m => {
        const count = tasks.filter(t => t.moduleId === m.id).length;
        return (
          <div className="mod-card" key={m.id}>
            <span className="mod-grip"><Ic.grip size={16} /></span>
            <span className="mod-swatch" style={{ background: m.color }} />
            <div className="mile-body">
              <div className="mile-name">{m.name}</div>
              <div className="mile-sub"><span>{count} tasks</span></div>
            </div>
            <button className="icon-btn"><Ic.dots size={17} /></button>
          </div>
        );
      })}
      <button className="add-row-btn"><Ic.plus size={15} /> New module</button>
    </div>
  );
}

/* ---------------- Project form (modal) ---------------- */
const COLOR_CHOICES = ["#3FB984","#6E8BFF","#A06BF0","#F0685E","#E8A33D","#34BE9A","#E06CA8","#4C8DFF"];
function ProjectForm({ onClose }) {
  const [emoji, setEmoji] = useState("🚀");
  const [color, setColor] = useState("#3FB984");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>New project</h2>
          <button className="icon-btn" onClick={onClose}><Ic.close size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="field-row" style={{ alignItems: "flex-end" }}>
            <div className="field" style={{ flex: "none" }}>
              <label>Icon</label>
              <UI.EmojiPicker value={emoji} onPick={setEmoji} triggerClass="emoji-solo" />
            </div>
            <div className="field" style={{ flex: 2 }}>
              <label>Name</label>
              <input value={name} onChange={e => { setName(e.target.value); if (!key) setKey(e.target.value.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "")); }} placeholder="e.g. Disk Advisor" autoFocus />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Key</label>
              <input className="key-input" value={key} onChange={e => setKey(e.target.value.toUpperCase().slice(0, 5))} placeholder="DISK" maxLength={5} />
            </div>
          </div>
          <div className="field">
            <label>Short description <span style={{ fontWeight: 450, color: "var(--text-faint)" }}>— one line</span></label>
            <input value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="What is this project, in a sentence?" />
          </div>
          <div className="field">
            <label>Long description <span style={{ fontWeight: 450, color: "var(--text-faint)" }}>— optional, Markdown</span></label>
            <textarea rows={4} value={longDesc} onChange={e => setLongDesc(e.target.value)} placeholder="Goals, context, why it exists…" />
          </div>
          <div className="field">
            <label>Colour</label>
            <div className="color-grid">
              {COLOR_CHOICES.map(c => (
                <button key={c} className="color-pick" data-on={color === c ? "" : undefined}
                  style={{ background: c, color: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Create project</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Login ---------------- */
function Login({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pw.length > 0) onUnlock(); else setErr(true); };
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <svg width="30" height="30" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <rect x="9" y="9" width="82" height="82" rx="22" stroke="currentColor" strokeWidth="8" />
            <rect x="28.5" y="31" width="10.5" height="47" rx="5.25" fill="currentColor" />
          </svg>
        </div>
        <div className="login-wordmark">
          <span className="lw">indie</span><span className="hw">work</span><span className="tw">.space</span>
        </div>
        <p>Just you. Enter your password to open the workspace.</p>
        <div className="login-field">
          <input type="password" value={pw} placeholder="Password" autoFocus
            onChange={e => { setPw(e.target.value); setErr(false); }}
            onKeyDown={e => { if (e.key === "Enter") submit(); }} />
          <button className="login-go" onClick={submit}><Ic.arrowRight size={18} /></button>
        </div>
        {err && <div className="login-err">Enter something to continue.</div>}
        <div className="login-hint">No sign-up · no recovery · no accounts. Just a lock.</div>
      </div>
    </div>
  );
}

window.OtherScreens = { Board, InboxView, Milestones, Modules, ProjectForm, Login };
