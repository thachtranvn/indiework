/* ============================================================
   Overview (editable project meta) + All-projects table
   ============================================================ */
const { useState: useStateOv, useRef: useRefOv } = React;
const { PROJECT_STATUSES: OV_PSTATUS, PROJECT_STATUS_MAP: OV_PSMAP } = window.PMData;
const OV = window.UI;

const OV_COLORS = ["#3FB984", "#6E8BFF", "#A06BF0", "#F0685E", "#E8A33D", "#34BE9A", "#E06CA8", "#4C8DFF", "#6B86A3"];
const OV_MILE_STATES = ["planned", "active", "done"];

/* ---- small project-status chip + picker ---- */
function ProjStatusChip({ status }) {
  const s = OV_PSMAP[status] || OV_PSTATUS[0];
  return <span className="pstatus"><span className="dot" style={{ background: `var(--st-${s.key})` }} /> {s.label}</span>;
}

function StatusPicker({ value, onPick }) {
  return (
    <OV.Popover width={180} align="left" trigger={
      <button className="ov-pickbtn"><ProjStatusChip status={value} /><Ic.chevD size={13} style={{ marginLeft: "auto", opacity: .6 }} /></button>
    }>
      {(close) => (
        <div className="opt-list">
          {OV_PSTATUS.map(s => (
            <button key={s.id} className="opt" data-active={s.id === value ? "" : undefined}
              onClick={() => { onPick(s.id); close(); }}>
              <span className="dot" style={{ background: `var(--st-${s.key})` }} />{s.label}
              {s.id === value && <Ic.check size={14} sw={2.4} style={{ marginLeft: "auto", color: "var(--accent-ink)" }} />}
            </button>
          ))}
        </div>
      )}
    </OV.Popover>
  );
}

/* ---- editable tag list ---- */
function TagEditor({ tags, onChange }) {
  const [val, setVal] = useStateOv("");
  const add = () => {
    const v = val.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setVal("");
  };
  return (
    <div className="tag-edit">
      {tags.map(t => (
        <span key={t} className="tagchip">
          {t}
          <button onClick={() => onChange(tags.filter(x => x !== t))} title="Remove"><Ic.close size={12} /></button>
        </span>
      ))}
      <input className="tag-input" value={val} placeholder="Add tag…"
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") add(); if (e.key === "Backspace" && !val && tags.length) onChange(tags.slice(0, -1)); }}
        onBlur={add} />
    </div>
  );
}

/* ---- markdown description with edit / preview ---- */
function MarkdownField({ value, onChange }) {
  const [mode, setMode] = useStateOv("edit");
  return (
    <div className="md-field">
      <div className="md-tabs">
        <button data-active={mode === "edit" ? "" : undefined} onClick={() => setMode("edit")}>Write</button>
        <button data-active={mode === "preview" ? "" : undefined} onClick={() => setMode("preview")}>Preview</button>
      </div>
      {mode === "edit"
        ? <textarea className="md-input" value={value} placeholder="Describe the project… (Markdown supported)"
            onChange={e => onChange(e.target.value)} />
        : <div className="md-render" dangerouslySetInnerHTML={{ __html: OV.mdToHtml(value || "_Nothing yet._") }} />}
    </div>
  );
}

/* ---- Overview tab ---- */
function Overview({ project, modules, milestones, tasks, onUpdate, mod, mile }) {
  const set = (patch) => onUpdate(project.id, patch);
  const projTasks = tasks.filter(t => t.projectId === project.id);
  return (
    <div className="overview">
      <div className="ov-layout">
        {/* main column — editable project meta */}
        <div className="ov-main">
          <div className="ov-grid">
            <label className="ov-label">Short description</label>
            <input className="ov-input" value={project.shortDesc || ""} placeholder="One line — what is this?"
              onChange={e => set({ shortDesc: e.target.value })} />

            <label className="ov-label">Status</label>
            <div><StatusPicker value={project.status} onPick={(s) => set({ status: s })} /></div>

            <label className="ov-label">Status note</label>
            <input className="ov-input" value={project.statusNote || ""} placeholder="Where is this project right now?"
              onChange={e => set({ statusNote: e.target.value })} />

            <label className="ov-label">Prefix</label>
            <input className="ov-input ov-key" value={project.key} maxLength={6}
              onChange={e => set({ key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) })} />

            <label className="ov-label">Tags</label>
            <TagEditor tags={project.tags || []} onChange={(tags) => set({ tags })} />
          </div>

          <label className="ov-label ov-desc-label">Description</label>
          <MarkdownField value={project.description || ""} onChange={(v) => set({ description: v })} />
        </div>

        {/* right sidebar — milestones & modules */}
        <aside className="ov-side">
          {/* Milestones */}
          <div className="ov-list-block">
            <div className="ov-list-head"><Ic.target size={15} /> Milestones <span className="ov-count">{milestones.length}</span></div>
            {milestones.map(m => {
              const mt = projTasks.filter(t => t.milestoneId === m.id);
              const done = mt.filter(t => t.done || t.status === "cancelled").length;
              const pct = mt.length ? done / mt.length : 0;
              return (
                <div className="ov-mile" key={m.id}>
                  <div className="ov-mile-top">
                    <input className="ov-rowname" value={m.name} onChange={e => mile.patch(m.id, { name: e.target.value })} />
                    <button className="icon-btn ov-del" onClick={() => mile.remove(m.id)} title="Delete"><Ic.trash size={15} /></button>
                  </div>
                  <div className="ov-mile-bottom">
                    <input className="ov-date" type="date" value={m.date || ""} onChange={e => mile.patch(m.id, { date: e.target.value })} />
                    <select className="ov-state" value={m.state} onChange={e => mile.patch(m.id, { state: e.target.value })}>
                      {OV_MILE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="ov-mile-prog">
                      <OV.Progress value={pct} width={48} tone={pct === 1 ? "done" : "accent"} />
                      <span className="ov-rowmeta">{done}/{mt.length}</span>
                    </span>
                  </div>
                </div>
              );
            })}
            <button className="add-row-btn sm" onClick={() => mile.add(project.id)}><Ic.plus size={14} /> New milestone</button>
          </div>

          {/* Modules */}
          <div className="ov-list-block">
            <div className="ov-list-head"><Ic.cube size={15} /> Modules <span className="ov-count">{modules.length}</span></div>
            {modules.map(m => {
              const count = projTasks.filter(t => t.moduleId === m.id).length;
              return (
                <div className="ov-row" key={m.id}>
                  <OV.Popover width={150} align="left" trigger={
                    <button className="ov-swatch" style={{ background: m.color }} title="Colour" />
                  }>
                    {(close) => (
                      <div className="color-grid" style={{ padding: 4 }}>
                        {OV_COLORS.map(c => (
                          <button key={c} className="color-pick" data-on={c === m.color ? "" : undefined}
                            style={{ background: c, color: c }} onClick={() => { mod.patch(m.id, { color: c }); close(); }} />
                        ))}
                      </div>
                    )}
                  </OV.Popover>
                  <input className="ov-rowname" value={m.name} onChange={e => mod.patch(m.id, { name: e.target.value })} />
                  <span className="ov-rowmeta">{count}</span>
                  <button className="icon-btn ov-del" onClick={() => mod.remove(m.id)} title="Delete"><Ic.trash size={15} /></button>
                </div>
              );
            })}
            <button className="add-row-btn sm" onClick={() => mod.add(project.id)}><Ic.plus size={14} /> New module</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---- All projects table, grouped by status ---- */
function ProjectsTable({ projects, tasks, onOpen }) {
  const [collapsed, setCollapsed] = useStateOv(() => new Set());
  const toggle = (id) => setCollapsed(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const issueCount = (p) => {
    const real = tasks.filter(t => t.projectId === p.id && t.status !== "inbox");
    return real.length ? real.length : (p.issues || 0);
  };
  return (
    <div className="ptable-wrap">
      <table className="ptable">
        <thead>
          <tr>
            <th className="pt-name">Project</th>
            <th>Short description</th>
            <th>Status note</th>
            <th className="pt-num">Issues</th>
            <th className="pt-tags">Tags</th>
          </tr>
        </thead>
        {OV_PSTATUS.map(s => {
          const rows = projects.filter(p => p.status === s.id);
          if (!rows.length) return null;
          const isOpen = !collapsed.has(s.id);
          return (
            <tbody key={s.id}>
              <tr className="pt-grouprow" data-collapsed={!isOpen ? "" : undefined} onClick={() => toggle(s.id)}>
                <td colSpan={5}>
                  <span className="pt-groupcaret"><Ic.chevD size={14} /></span>
                  <span className="dot" style={{ background: `var(--st-${s.key})` }} />
                  {s.label}<span className="pt-groupcount">{rows.length}</span>
                </td>
              </tr>
              {isOpen && rows.map(p => (
                <tr key={p.id} className="pt-row" onClick={() => onOpen(p.id)}>
                  <td className="pt-name">
                    <span className="nav-emoji">{p.emoji}</span>
                    <span className="pt-pname">{p.name}{p.pinned && <Ic.pin size={11} style={{ marginLeft: 5, color: "var(--text-faint)" }} />}</span>
                    <span className="pt-key">{p.key}</span>
                  </td>
                  <td className="pt-desc">{p.shortDesc}</td>
                  <td className="pt-note">{p.statusNote}</td>
                  <td className="pt-num">{issueCount(p)}</td>
                  <td className="pt-tags">
                    <div className="pt-tagrow">
                      {(p.tags || []).map(t => <span key={t} className="tagchip sm">{t}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

window.OverviewScreens = { Overview, ProjectsTable, ProjStatusChip };
